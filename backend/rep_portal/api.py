#!/usr/bin/env python3

"""
:author: Mateusz Plinta
:contact: mateusz.plinta@.com
:description:
"""
from numpy import isin
from django.conf import settings
from rep_api import RepApi
from urllib.parse import quote
import datetime
import time
import json
import re


class RepPortalError(Exception): 
    pass

class RepPortal():
    minute = 0
    post_count = 0
    POST_THROTTLE_LIMIT = 60

    def __init__(self, token=None):
        self.user = settings.RP_USER
        self.passwd = settings.RP_PASSWORD
        self.token = token
        self.basic_url = 'https://rep-portal.wroclaw.nsn-rdnet.net/api/automatic-test/'
        
        self._default_dict = {"common_build": None, "pronto": "", "default_blocked": "true", "runs": None,
                              "send_to_qc": "false", "result": None, "comment": None}
        self._test_run_results = ["passed", "failed", "blocked", "environment issue"]
        self._env_issue_type = ["Precondition", "TA_SCRIPT", "Other", "BTS", "TOOLS", "UTE",
                                "TA_FRAMEWORK", "iPHY", "LMTS", "RealUE", "TM500", "Robustness",
                                "Env_gNB", "Pre Check", "iphy", "UE", "RTG", "Renesas", "Core", "SCF", "TestLine", "Lib", "Software", "PowerSupply"]
        self.basic_fields_list = [
            'id', 
            'qc_test_set', 
            'qc_test_instance', 
            'organization', 
            'hyperlink_set', 
            'test_suite', 
            'test_case__name', 
            'test_col', 
            'test_line', 
            'result', 
            'env_issue_type', 
            'comment', 
            'builds',
            'fail_message', 
            'start',
            'end'
        ]
        
        self.filter_dict = {
            "builds": "builds__name__pos_neg",
            "test_set": "qc_test_instance__test_set__name__pos_neg",
            "test_object": "qc_test_instance__test_object__pos_neg",
            "test_case": "test_case__name__name__pos_neg",
            "testline_type": "test_col__testline_type__pos_neg",
            "test_lab_path": "qc_test_instance__m_path__pos_neg_empty_str",
            "fail_message": "fail_message__pos_neg",
            "result": "result__name__pos_neg",
            "env_issue_type": "envIssueType",
            "comment": "comment"
        }


    def _get_fields_to_url(self, fields):
        if fields is None:
            fields = []
        if fields:
            if isinstance(fields, list):
                pass
            elif isinstance(fields, str):
                fields = fields.strip().split(',')
            else:
                raise RepPortalError('fields type {} is not list or string'.format(type(fields)))
        return "fields=" + ",".join(self.basic_fields_list + fields)
    

    def _get_filters_to_url(self, filters):
        if filters is None:
            return None
        filters_list = []
        for key, value in filters.items():
            try:
                if isinstance(value, list):
                    value = ",".join(value)
                value_url_parsed = quote(value)
                filter_str = f"{self.filter_dict[key]}={value_url_parsed}"
                filters_list.append(filter_str)
            except KeyError:
                print(f"No such key {key} available. You need to select from: {self.filter_dict.keys()}")
                raise
        return "&".join(filters_list)
            
            
    def _build_get_url_for_testruns(self, limit, filters=None, fields=None, ordering=None):
        limit = f"limit={limit}"
        url_components = [limit]
        filters = self._get_filters_to_url(filters)
        fields = self._get_fields_to_url(fields)
        if ordering:
            url_components.append(f"ordering={ordering}")
        if filters:
            url_components.append(filters)
        url_components.append(fields)
        base_url = f"{self.basic_url}runs/report/?"
        print(url_components)
        rest_url = '&'.join(url_components)
        return f"{base_url}{rest_url}"
    

    def get_data_from_testruns(self, limit, filters=None, fields=None, ordering=None):            
        url = self._build_get_url_for_testruns(limit, filters, fields, ordering)
        # with RepApi(username=self.user, password=self.passwd, config='rep-prod-one') as api:
        #     print(url)
        #     data = api.get(url, params=None)
        api = RepApi(username=self.user, password=self.passwd, config='rep-prod-one')
        api.session.login(token=self.token)
        print(url)
        data = api.get(url, params=None)

        retry = 3
        while retry > 0:
            resp = api.get(url, params=None)
            if resp.status_code == 200:
                break
            elif resp.status_code == 429:
                wait_sec_until_new_minute_starts = 60 - int(time.time()) % 60
                time.sleep(wait_sec_until_new_minute_starts)
                retry -= 1
                continue
            else:
                print(resp)
                print(resp.text)
                print(resp.status_code)
                break

        api.logout()
        return resp.json()['results']


    def _generate_analyze_json(self, runs, result, comment, env_issue_type=None, common_build="", suggested_prontos=[], pronto="", 
                               default_blocked=True, send_to_qc=False, suspend=None, suspension_end = None):
        if result == "environment issue" and not env_issue_type:
            raise TypeError(f"Result if {result}, but env_issue_type is not defined!")
        data = {
            "common_build": common_build,
            "suggested_prontos": [],
            "pronto": pronto,
            "default_blocked": default_blocked,
            "runs": runs,
            "send_to_qc": send_to_qc,
            "result": result,
            "comment": comment,
        }
        if env_issue_type:
            data["env_issue_type"] = env_issue_type
        if suspend:
            data["suspend"] = suspend
        if suspension_end:
            data["suspension_end"] = suspension_end
        return data


    def analyze_testruns(self, runs, comment, result="environment issue", env_issue_type=None):
        data = self._generate_analyze_json(runs=runs, comment=comment, result=result, env_issue_type=env_issue_type)
        url = "https://rep-portal.wroclaw.nsn-rdnet.net/api/automatic-test/runs-analyze/"
        # with RepApi(username=self.user, password=self.passwd, config='rep-prod-one') as api:
        api = RepApi(username=self.user, password=self.passwd, config='rep-prod-one')
        api.session.login(token=self.token)
        retry = 3
        while retry > 0:
            resp = api.post(url, params=None, data=data)
            if resp.status_code == 200:
                break
            elif resp.status_code == 429:
                wait_sec_until_new_minute_starts = 60 - int(time.time()) % 60
                time.sleep(wait_sec_until_new_minute_starts)
                retry -= 1
                continue
            else:
                print(resp)
                print(resp.text)
                print(resp.status_code)
                break
        api.logout()
        return resp
