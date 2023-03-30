#!/usr/bin/env python3

"""
:author: Mateusz Plinta
:contact: mateusz.plinta@.com
:description:
"""
from numpy import isin
from rep_api import RepApi
from urllib.parse import quote, urlparse, urlsplit, parse_qs
from functools import wraps
from typing import List, Union
import datetime
import time
import json
import re


class RepPortalError(Exception): 
    pass

class RepPortalFieldNotFound(Exception): 
    pass

class RepPortal():
    CONFIG = 'rep-prod-one'
    API_THROTTLE_TIME = 60
    ENV_ISSUE_TYPES = ["Precondition", "TA_SCRIPT", "Other", "BTS", "TOOLS", "UTE", "TA_FRAMEWORK", "iPHY", "LMTS", "RealUE", "TM500", "Robustness",
                       "Env_gNB", "Pre Check", "iphy", "UE", "RTG", "Renesas", "Core", "SCF", "TestLine", "Lib", "Software", "PowerSupply"]
    TEST_RUN_LIST_URL = 'https://rep-portal.wroclaw.nsn-rdnet.net/api/automatic-test/'
    TEST_RUN_ANALYZE_URL = "https://rep-portal.wroclaw.nsn-rdnet.net/api/automatic-test/runs-analyze/"

    TEST_INSTANCE_LIST_URL = ('https://rep-portal.wroclaw.nsn-rdnet.net/api/qc-beta/instances/batch/?ti_scope=true&limit={}&ordering=name&'
                              'fields=id%2Csuspended%2Cm_path%2Crelease%2Ctest_set__name%2Cname%2Curl%2Cstatus%2Cstatus_color%2Clast_passed__timestamp'
                              '%2Ctest_lvl_area%2Csw_build%2Cpronto_view_type')
    TEST_INSTANCE_SUSPEND_URL = "https://rep-portal.wroclaw.nsn-rdnet.net/api/qc-edit-async/instance/"
    REGRESSION_INSTANCE_URL = ('https://rep-portal.wroclaw.nsn-rdnet.net/api/adapted_tes/?by=Organization&det_auto_lvl__pos_neg=-"99 - Planned"&fb=current&fields=name,'
                               'passed,failed,blocked,n/a,not_analyzed,no_run,empty,postponed,not_completed,total,passedrate,average_exec_rate,cloud_rate&'
                               'organization__pos_neg="{organization}"&regression_status__name__pos_neg={regression_test_types}&releases={release}&test_cycle=Feature Build')

    TEST_RUN_BASIC_FIELDS = [
        'id', 
        'airphone', 
        'qc_test_set', 
        'qc_test_instance', 
        'qc_test_instance__test_entity', 
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
        'end',
        'rerun_in_cloud',
        'cit_cdrt_result',
        'tc_execution_id',
        'qc_test_instance__param1'

    ]

    TEST_RUN_FILTER_DICT =  {
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

    def __init__(self, token=None, user=None, passwd=None, debug=False):
        self.user = user
        self.passwd = passwd
        self.token = token
        self.debug = debug


    def _get_fields_to_testruns_url(self, fields):
        if fields is None:
            fields = []
        if fields:
            if isinstance(fields, list):
                pass
            elif isinstance(fields, str):
                fields = fields.strip().split(',')
            else:
                raise RepPortalError('fields type {} is not list or string'.format(type(fields)))
        return "fields=" + ",".join(RepPortal.TEST_RUN_BASIC_FIELDS + fields)
    

    def _get_filters_to_testruns_url(self, filters):
        if filters is None:
            return None
        filters_list = []
        for key, value in filters.items():
            try:
                if isinstance(value, list):
                    value = ",".join(value)
                value_url_parsed = quote(value)
                filter_str = f"{RepPortal.TEST_RUN_FILTER_DICT[key]}={value_url_parsed}"
                filters_list.append(filter_str)
            except KeyError:
                print(f"No such key {key} available. You need to select from: {RepPortal.TEST_RUN_FILTER_DICT.keys()}")
                raise
        return "&".join(filters_list)
            
            
    def _get_testruns_url(self, limit, filters=None, fields=None, ordering=None):
        limit = f"limit={limit}"
        url_components = [limit]
        filters = self._get_filters_to_testruns_url(filters)
        fields = self._get_fields_to_testruns_url(fields)
        if ordering:
            url_components.append(f"ordering={ordering}")
        if filters:
            url_components.append(filters)
        url_components.append(fields)
        base_url = f"{RepPortal.TEST_RUN_LIST_URL}runs/report/?"
        rest_url = '&'.join(url_components)
        return f"{base_url}{rest_url}"


    def _get_testinstances_url(self, ids=None, test_lab_path=None, organization=None, limit=2000):
        url = RepPortal.TEST_INSTANCE_LIST_URL.format(limit) 
        if ids:
            if isinstance(ids, list):
                url += '&id__in=' + ','.join([str(x) for x in ids])
            else:
                url += f"&id__in={ids}"

        if test_lab_path:
            test_lab_path = test_lab_path.replace('\\', '%5C')
            url += f"&m_path__pos_neg={test_lab_path}"
        if organization:
            url += f"&organization__pos_neg=\"{organization}\""
        return url


    def _generate_analyze_dict(self, runs: List[int], result: str, comment: str, env_issue_type=None, common_build="", suggested_prontos: List[str]=[], 
                               pronto="", default_blocked=True, send_to_qc=False, suspend=None, suspension_end=None):
        if result == "environment issue" and not env_issue_type:
            raise TypeError(f"Result is {result}, but env_issue_type is not defined!")
        data = {
            "common_build": common_build,
            "suggested_prontos": suggested_prontos,
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
        if suspend and suspension_end:
            data["suspension_end"] = suspension_end
        return data


    def _get_logged_in_repapi_instance(self):
        api = RepApi(username=self.user, password=self.passwd, config=RepPortal.CONFIG)
        api.session.login(token=self.token)
        return api

    def api_get_wrapper(retry, unpack_results=True):
        def rewrap(func):
            @wraps(func)
            def wrap(self, *args, **kwargs):
                api = self._get_logged_in_repapi_instance()
                _retry = retry
                try:
                    while _retry > 0:
                        resp, url = func(self, api=api, *args, **kwargs)
                        if resp.status_code == 200:
                            break
                        elif resp.status_code == 429:
                            wait_sec_until_throttle_is_finished = RepPortal.API_THROTTLE_TIME - int(time.time()) % RepPortal.API_THROTTLE_TIME
                            time.sleep(wait_sec_until_throttle_is_finished)
                            _retry -= 1
                            continue
                        else:
                            raise RepPortalError(f"Unexpected response: {resp}, {resp.text}, {resp.status_code}, url: {url}")
                finally:
                    api.logout()

                if unpack_results:
                    results = resp.json().get('results', None)
                    if results is None:
                        raise RepPortalError(f"Last response: {resp}, {resp.text}. No results for url: {url}")
                    return results, url
                else:
                    return resp, url
            return wrap
        return rewrap


    def api_post_wrapper(retry):
        def rewrap(func):
            @wraps(func)
            def wrap(self, *args, **kwargs):
                if self.debug:
                    return func(self, *args, **kwargs)
                api = self._get_logged_in_repapi_instance()
                _retry = retry
                try:
                    while _retry > 0:
                        resp, url, data = func(self, api=api, *args, **kwargs)
                        if resp.status_code in [200, 202]:
                            break
                        elif resp.status_code == 429:
                            wait_sec_until_throttle_is_finished = RepPortal.API_THROTTLE_TIME - int(time.time()) % RepPortal.API_THROTTLE_TIME
                            time.sleep(wait_sec_until_throttle_is_finished)
                            _retry -= 1
                            continue
                        else:
                            raise RepPortalError(f"Unexpected response: {resp}, {resp.text}, {resp.status_code}, url: {url}, data: {data}")
                finally:
                    api.logout()
                return resp, url, data
            return wrap
        return rewrap


    @api_get_wrapper(retry=5)
    def get_data_from_testruns(self, limit, filters=None, fields=None, ordering=None, *args, **kwargs):            
        url = self._get_testruns_url(limit, filters, fields, ordering)
        resp = kwargs["api"].get(url, params=None)
        return resp, url


    @api_get_wrapper(retry=5)
    def get_data_from_testinstances(self, ids: Union[list, str]=None, test_lab_path=None, organization=None, limit=2000, *args, **kwargs):            
        url = self._get_testinstances_url(ids=ids, test_lab_path=test_lab_path, organization=organization, limit=limit)
        resp = kwargs["api"].get(url, params=None)
        return resp, url


    @api_get_wrapper(retry=5)
    def get_regression_status_for_present_feature_build(self, organization, release="Trunk", regression_test_types="rg_CIT,rg_CRT", *args, **kwargs):
        release_dict = {
            "Trunk": "RAN00"
        }
        regression_test_types_dict = {
            "CIT": "rgCIT",
            "CRT": "rgCRT",
        }
        if release in release_dict.keys():
            release = release_dict[release]
        
        if isinstance(regression_test_types, list):
            regression_test_types = ",".join([regression_test_types_dict[rtt] for rtt in regression_test_types])

        url = RepPortal.REGRESSION_INSTANCE_URL.format(organization=organization, regression_test_types=regression_test_types, release=release)
        resp = kwargs["api"].get(url, params=None)
        return resp, url

    
    def get_test_instances_for_present_feature_build_with_specified_status(self, organization, status="no_run", release="Trunk", regression_test_types="rg_CIT,rg_CRT"):
        if status not in ["passed", "failed", "blocked", "n/a", "no_run", "not_analyzed", "not_completed", "empty", "postponed", "total"]:
            raise RepPortalError("Specified status is not supported")
        
        status += "_url"
        results, url = self.get_regression_status_for_present_feature_build(organization=organization, release=release, regression_test_types=regression_test_types)
        details = None
        for elem in results:
            if elem["name"] == organization:
                details = elem
                break
        if not details:
            raise RepPortalError(f"Results do not contain info for this organization: {organization}")
        if status not in details.keys():
            raise RepPortalFieldNotFound(f"Results do not contain info for this tests status: {status}")
        
        params = parse_qs(urlsplit(elem[status]).query)
        params = {key: value[0] for key, value in params.items()}
        res, url = self.get_data_from_testinstances(ids=params["id"], organization=organization)
        return res


    @api_post_wrapper(retry=3)
    def set_suspension_status_for_test_instances(self, ti_ids: List[int], suspend_status: bool=False, *args, **kwargs):
        url = RepPortal.TEST_INSTANCE_SUSPEND_URL
        payload = {
            "id": ti_ids,
            "quantity": len(ti_ids),
            "changes": [
                { 
                    "field": "suspended",
                    "newValue": "true" if suspend_status is True else "false" 
                }
            ]
        }
        api = kwargs["api"]
        resp = super(api.session.__class__, api.session).post(url=url, headers={"Content-Type": "application/json"}, data=json.dumps(payload))
        return resp, url, payload


    @api_post_wrapper(retry=3)
    def analyze_testruns(self, runs, comment, common_build, result="environment issue", env_issue_type=None, *args, **kwargs):
        if self.debug:
            return None, None, "DEBUG is set to True, will skip sending data to RP"
        url = RepPortal.TEST_RUN_ANALYZE_URL
        data = self._generate_analyze_dict(runs=runs, comment=comment, result=result, env_issue_type=env_issue_type, common_build=common_build)
        resp = kwargs["api"].post(url, params=None, data=data)
        return resp, url, data
