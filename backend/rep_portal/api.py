#!/usr/bin/env python3

"""
:author: Mateusz Plinta
:contact: mateusz.plinta@.com
:description:
"""
from numpy import isin
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

    def __init__(self):
        self.user = 'sc'
        self.log = 'Pico1234^'
        self.basic_url = 'https://rep-portal.wroclaw.nsn-rdnet.net/api/automatic-test/'

        self._default_dict = {"common_build": None, "pronto": "", "default_blocked": "true", "runs": None,
                              "send_to_qc": "false", "result": None, "comment": None}
        self._test_run_results = ["passed", "failed", "blocked", "environment issue"]
        self._env_issue_type = ["Precondition", "TA_SCRIPT", "Other", "BTS", "TOOLS", "UTE",
                                "TA_FRAMEWORK", "iPHY", "LMTS", "RealUE", "TM500", "Robustness",
                                "Env_gNB", "Pre Check", "iphy", "RTG", "Renesas"]
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
        with RepApi(username=self.user, password=self.log, config='rep-prod-one') as api:
            print(url)
            data = api.get(url, params=None)
        return data.json()['results']


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
        with RepApi(username=self.user, password=self.log, config='rep-prod-one') as api:
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
        return resp





    # def get_data(self, url):
    #     with RepApi(username=self.user, password=self.log, config='rep-prod-one') as api:
    #         print(url)
    #         data = api.get(url, params=None)
    #     return data.json()['results']


    # def _param_list_handle(self, param_list):
    #     if param_list:
    #         if isinstance(param_list, list):
    #             return param_list + self.basic_param_list
    #         elif isinstance(param_list, str):
    #             return self.basic_param_list + [param_list]
    #         else:
    #             raise RepPortalError('param list type {} is not list or string'.format(type(param_list)))
    #     else:
    #         return self.basic_param_list


    # def _build_get_url(self, param_list, limit=30):
    #     param_list = self._param_list_handle(param_list)
    #     url = '{}{}'.format(self.basic_url, 'runs/report/?fields=no')
    #     for param in param_list:
    #         url = '{},{}'.format(url, param.replace(' ', '+'))
    #     url = '{}&limit={}'.format(url, str(limit))
    #     return '{}&stat_n4_manager=%22mmech%22'.format(url)


    # def get_data_and_filter(self, filter_dict, limit=10000, param_list=None):
    #     url = self._build_get_url(param_list=param_list, limit=limit)
    #     with RepApi(username=self.user, password=self.log, config='rep-prod-one') as api:
    #         data = api.get(url, params=None)
    #     filtered_data = data.json()['results']
    #     for key, msg in filter_dict.items():
    #         filtered_data = self._get_test_dict_with_msg(msg, filtered_data, key)
    #     return filtered_data


    # def get_test_lab_path_results_with_given_msg(self, msg, limit=30, test_object=None, organization=None):
    #     url = self._build_get_url(limit, result='passed')
    #     with RepApi(username=self.user, password=self.log, config='rep-prod-one') as api:
    #         data = api.get(url, params=None)
    #     data_dict = data.json()
    #     return self._get_test_dict_with_msg(msg, data_dict['results'], 'test_lab_path')


    # def get_qc_test_set_results_with_given_msg(self, msg, limit=30, test_object=None, organization=None):
    #     url = self._build_get_url(limit, result='passed')
    #     with RepApi(username=self.user, password=self.log, config='rep-prod-one') as api:
    #         data = api.get(url, params=None)
    #     data_dict = data.json()
    #     return self._get_test_dict_with_msg(msg, data_dict['results'], 'qc_test_set')


    # def get_test_results_with_given_msg(self, msg, limit=30, result='not analyzed'):
    #     url = self._build_get_url(limit, result)
    #     with RepApi(username=self.user, password=self.log, config='rep-prod-one') as api:
    #         data = api.get(url, params=None)
    #     data_dict = data.json()
    #     return self._get_test_dict_with_msg(msg, data_dict['results'], 'test_exception_message')


    # def _get_test_dict_with_msg(self, msg, data_list, search_key):
    #     if isinstance(data_list, list):
    #         selected_data = list()
    #         for test_run in data_list:
    #             if isinstance(search_key, tuple):
    #                 key = self._handle_tuple_key(search_key, test_run)
    #             else:
    #                 key = test_run[search_key]
    #             if re.search(msg, key):
    #                 selected_data.append(test_run)
    #         return selected_data


    # def _handle_tuple_key(self, search_key, test_run):
    #     key = test_run
    #     for item in search_key:
    #         try:
    #             key = key[item]
    #         except KeyError:
    #             key = "Doesn't have excpected key"
    #             break
    #     return key


    # def _extract_data_from_selected_tests(self, selected_data):
    #     extracted_tests_info = dict()
    #     for test in selected_data:
    #         id = test['id']
    #         build = test['builds']
    #         self._parse_to_dict(extracted_tests_info, id, build)
    #     return extracted_tests_info


    # def _parse_to_dict(self, adict, id, build):
    #     if build in adict:
    #         adict[build].append(str(id))
    #     else:
    #         adict.update({build: [str(id)]})


    # def _build_post_url(self, ids_list):
    #     basic_url = '{}{}'.format(self.basic_url, 'runs-analyze/?ids=')
    #     ids = ','.join(ids_list)
    #     return '{}{}'.format(basic_url, ids)


    # def _create_post_info_dict(self, result, comment, env_issue_type=None, build=None):
    #     post_info_dict = self._default_dict
    #     post_info_dict["comment"] = comment
    #     if result in self._test_run_results:
    #         post_info_dict["result"] = result
    #         self._set_env_issue_type(post_info_dict, result, env_issue_type)
    #     #TODO raise error
    #     return post_info_dict


    # def _set_env_issue_type(self, post_info_dict, result, env_issue_type):
    #     if result == "environment issue":
    #         if env_issue_type in self._env_issue_type:
    #             post_info_dict.update({"env_issue_type": env_issue_type})
    #     #TODO raise error


    # def _post_all_test_results(self, extracted_tests_info, param_dict):
    #     for build in extracted_tests_info.keys():
    #         url = self._build_post_url(extracted_tests_info[build])
    #         param_dict['common_build'] = build
    #         param_dict['runs'] = extracted_tests_info[build]
    #         self._post_test_result(url, param_dict)



    #data = get_test_results_with_given_msg(msg=_re_wts_went_wrong)
    #extracted_tests_info = _extract_data_from_selected_tests(data)
    #com = _create_post_info_dict(result="environment issue", comment = 'gnb not on-Air', env_issue_type="iPHY")
    #_post_all_test_results(extracted_tests_info, com)

#_re_qc_msg = r'5GC001085-B'
# list_param = 'qc_test_instance,qc_test_set,end'
# data = RepPortal().get_data_and_filter({('qc_test_instance', 'organization'):r'RAN_L2',
#                                        'qc_test_set':'gNB_neighbor_NRREL_and_Xn_addition_SON_Config_Transfer',
#                                        'end':'2022-03-24T01'}, param_list=list_param)
