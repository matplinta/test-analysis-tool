#!/usr/bin/env python3

"""
:author: Mateusz Plinta
:contact: mateusz.plinta@.com
:description:
"""
from rep_api import RepApi
import json
import re


class RepPortalError(Exception): pass


_re_egate_timer_expired = "It was not possible to find string after 15\.0 secs to match regexp \(Received REGISTRATION COMPLETE fCellId:50\]\[RNTI:0x88\]RAR Timer has expired;"
_re_wts_went_wrong = "Something went wrong during setting up WTS"


class RepPortal():


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
        self.basic_param_list = ['id', 'qc_test_set', 'test_case__name', 'configuration', 'result', 'builds', 'fail_message', 'end']


    def _param_list_handle(self, param_list):
        if param_list:
            if isinstance(param_list, list):
                return param_list + self.basic_param_list
            elif isinstance(param_list, str):
                return self.basic_param_list + [param_list]
            else:
                raise RepPortalError('param list type {} is not list or string'.format(type(param_list)))
        else:
            return self.basic_param_list


    def _build_get_url(self, param_list, limit=30):
        param_list = self._param_list_handle(param_list)
        url = '{}{}'.format(self.basic_url, 'runs/report/?fields=no')
        for param in param_list:
            url = '{},{}'.format(url, param.replace(' ', '+'))
        url = '{}&limit={}'.format(url, str(limit))
        return '{}&stat_n4_manager=%22mmech%22'.format(url)


    def get_data_and_filter(self, filter_dict, limit=10000, param_list=None):
        url = self._build_get_url(param_list=param_list, limit=limit)
        with RepApi(username=self.user, password=self.log, config='rep-prod-one') as api:
            data = api.get(url, params=None)
        filtered_data = data.json()['results']
        for key, msg in filter_dict.items():
            filtered_data = self._get_test_dict_with_msg(msg, filtered_data, key)
        return filtered_data


    def get_test_lab_path_results_with_given_msg(self, msg, limit=30, test_object=None, organization=None):
        url = self._build_get_url(limit, result='passed')
        with RepApi(username=self.user, password=self.log, config='rep-prod-one') as api:
            data = api.get(url, params=None)
        data_dict = data.json()
        return self._get_test_dict_with_msg(msg, data_dict['results'], 'test_lab_path')


    def get_qc_test_set_results_with_given_msg(self, msg, limit=30, test_object=None, organization=None):
        url = self._build_get_url(limit, result='passed')
        with RepApi(username=self.user, password=self.log, config='rep-prod-one') as api:
            data = api.get(url, params=None)
        data_dict = data.json()
        return self._get_test_dict_with_msg(msg, data_dict['results'], 'qc_test_set')


    def get_test_results_with_given_msg(self, msg, limit=30, result='not analyzed'):
        url = self._build_get_url(limit, result)
        with RepApi(username=self.user, password=self.log, config='rep-prod-one') as api:
            data = api.get(url, params=None)
        data_dict = data.json()
        return self._get_test_dict_with_msg(msg, data_dict['results'], 'test_exception_message')


    def _get_test_dict_with_msg(self, msg, data_list, search_key):
        if isinstance(data_list, list):
            selected_data = list()
            for test_run in data_list:
                if isinstance(search_key, tuple):
                    key = self._handle_tuple_key(search_key, test_run)
                else:
                    key = test_run[search_key]
                if re.search(msg, key):
                    selected_data.append(test_run)
            return selected_data


    def _handle_tuple_key(self, search_key, test_run):
        key = test_run
        for item in search_key:
            try:
                key = key[item]
            except KeyError:
                key = "Doesn't have excpected key"
                break
        return key


    def _extract_data_from_selected_tests(self, selected_data):
        extracted_tests_info = dict()
        for test in selected_data:
            id = test['id']
            build = test['builds']
            self._parse_to_dict(extracted_tests_info, id, build)
        return extracted_tests_info


    def _parse_to_dict(self, adict, id, build):
        if build in adict:
            adict[build].append(str(id))
        else:
            adict.update({build: [str(id)]})


    def _build_post_url(self, ids_list):
        basic_url = '{}{}'.format(self.basic_url, 'runs-analyze/?ids=')
        ids = ','.join(ids_list)
        return '{}{}'.format(basic_url, ids)


    def _create_post_info_dict(self, result, comment, env_issue_type=None, build=None):
        post_info_dict = self._default_dict
        post_info_dict["comment"] = comment
        if result in self._test_run_results:
            post_info_dict["result"] = result
            self._set_env_issue_type(post_info_dict, result, env_issue_type)
        #TODO raise error
        return post_info_dict


    def _set_env_issue_type(self, post_info_dict, result, env_issue_type):
        if result == "environment issue":
            if env_issue_type in self._env_issue_type:
                post_info_dict.update({"env_issue_type": env_issue_type})
        #TODO raise error


    def _post_all_test_results(self, extracted_tests_info, param_dict):
        for build in extracted_tests_info.keys():
            url = self._build_post_url(extracted_tests_info[build])
            param_dict['common_build'] = build
            param_dict['runs'] = extracted_tests_info[build]
            self._post_test_result(url, param_dict)



    #data = get_test_results_with_given_msg(msg=_re_wts_went_wrong)
    #extracted_tests_info = _extract_data_from_selected_tests(data)
    #com = _create_post_info_dict(result="environment issue", comment = 'gnb not on-Air', env_issue_type="iPHY")
    #_post_all_test_results(extracted_tests_info, com)

#_re_qc_msg = r'5GC001085-B'
# list_param = 'qc_test_instance,qc_test_set,end'
# data = RepPortal().get_data_and_filter({('qc_test_instance', 'organization'):r'RAN_L2',
#                                        'qc_test_set':'gNB_neighbor_NRREL_and_Xn_addition_SON_Config_Transfer',
#                                        'end':'2022-03-24T01'}, param_list=list_param)
