#!/usr/bin/env python3

"""
:author: Mateusz Plinta
:contact: mateusz.plinta@.com
:description:
"""
from rep_api import RepApi
import json
import re


_re_egate_timer_expired = "It was not possible to find string after 15\.0 secs to match regexp \(Received REGISTRATION COMPLETE fCellId:50\]\[RNTI:0x88\]RAR Timer has expired;"
_re_wts_went_wrong = "Something went wrong during setting up WTS"


class RepPortal():


    def __init__(self)
        self.user = 'sc'
        self.log = 'Pico1234^'
        self.basic_url = 'https://rep-portal.wroclaw.nsn-rdnet.net/api/automatic-test/'

        self._default_dict = {"common_build": None, "pronto": "", "default_blocked": "true", "runs": None,
                              "send_to_qc": "false", "result": None, "comment": None}
        self._test_run_results = ["passed", "failed", "blocked", "environment issue"]
        self._env_issue_type = ["Precondition", "TA_SCRIPT", "Other", "BTS", "TOOLS", "UTE",
                                "TA_FRAMEWORK", "iPHY", "LMTS", "RealUE", "TM500", "Robustness",
                                "Env_gNB", "Pre Check", "iphy", "RTG", "Renesas"]


    def _build_get_url(self, limit=30, result='not analyzed'):
        basic_url = '{}{}'.fromat(self.basic_url, 'runs/report/?fields=no,id,result_color,qc_test_instance__m_path,')
        params1 = 'qc_test_set,test_case__qc_instance_number,test_case__name,hyperlink_set__test_logs_url,rain_url,'
        params2 = 'url,configuration,qc_test_instance__res_tester,end,result,env_issue_type,comment,test_line,'
        params3 = 'test_col__testline_type,builds,qc_test_instance__organization,pronto,test_exception_message'
        suburl = '{}{}{}'.format(basic_url, params1, params2)
        url_limit = '{}&limit={}'.format(suburl, str(limit))
        parsed_result = result.replace(' ', '+')
        return '{}&result__name__pos_neg={}&stat_n4_manager=%22mmech%22'.format(url_limit, parsed_result)


    def get_test_results_with_given_msg(self, msg, limit=30, result='not analyzed'):
        url = self._build_get_url(limit, result)
        with RepApi(username=user, password=log, config='rep-prod-one') as api:
            data = api.get(url, params=None)
        data_dict = data.json()
        return self._get_test_dict_with_msg(msg, data_dict['results'])


    def _get_test_dict_with_msg(self, msg, data_list):
        selected_data = list()
        for test_run in data_list:
            if re.search(msg, test_run['test_exception_message']):
                selected_data.append(test_run)
        return selected_data


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
            url = _build_post_url(extracted_tests_info[build])
            param_dict['common_build'] = build
            param_dict['runs'] = extracted_tests_info[build]
            _post_test_result(url, param_dict)



    #data = get_test_results_with_given_msg(msg=_re_wts_went_wrong)
    #extracted_tests_info = _extract_data_from_selected_tests(data)
    #com = _create_post_info_dict(result="environment issue", comment = 'gnb not on-Air', env_issue_type="iPHY")
    #_post_all_test_results(extracted_tests_info, com)

def _post_test_result(url, data):
    print('#################################')
    print(data)
    with RepApi(username=user, password=log, config='rep-prod-one') as api:
        data_post = api.post(url, data=data)
        print('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%')
        print(data_post)
        print(data_post.text)
        print(data_post.url)
url = 'https://rep-portal.wroclaw.nsn-rdnet.net/api/automatic-test/runs-analyze/?ids=58762792'
data = {'common_build': 'SBTS00_ENB_9999_220223_000007', 'pronto': '', 'default_blocked': 'true', 'runs': ['58762792'],
        'send_to_qc': 'false', 'result': 'environment issue', 'comment': 'gnb not on-Air', 'env_issue_type': 'iPHY'}
_post_test_result(url, data)
wrong_msg = get_test_results_with_given_msg(msg=_re_wts_went_wrong)
print('***************************************')
print(wrong_msg)


