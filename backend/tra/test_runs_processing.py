from distutils.command.build import build
from rep_portal.api import RepPortal, RepPortalError
import json
from datetime import datetime
import logging
from typing import List, Dict, Tuple
from django.conf import settings
from itertools import chain
import re
from django.contrib.auth.models import User
from celery import shared_task
from .models import (
    FeatureBuild,
    LastPassingLogs,
    Organization, 
    TestRunResult, 
    TestlineType, 
    TestSetFilter, 
    TestInstance, 
    TestRun, 
    EnvIssueType, 
    FailMessageType,
    FailMessageTypeGroup,
)

from . import utils
from . import tasks as celery_tasks


class TestRunWithSuchRPIDAlreadyExists(Exception):
    pass


class TestRunFBOlderThan3ConsecFBs(Exception):
    pass


def get_fail_message_types_from_testset_filter(testset_filter: TestSetFilter) -> List[FailMessageType]:
    fmtgs = testset_filter.fail_message_type_groups.all()
    fmtg_fmt_list = [fmtg.fail_message_types.all() for fmtg in fmtgs]
    fmts = list(chain(*fmtg_fmt_list))
    return fmts


def match_fail_message_type(fail_message: str, fail_message_types: List[FailMessageType]) -> Tuple[FailMessageType, int]:
    lines = fail_message.split('\n')
    for no, line in enumerate(lines):
        for fmt in fail_message_types:
            if re.search(fmt.regex, line):
                return fmt, no
    return None, None


def send_testrun_analysis_to_rp(test_run, token):
    celery_tasks.celery_analyze_testruns.delay(
        runs=[test_run.rp_id], 
        comment=f"Analyzed by user {test_run.analyzed_by.username}: {test_run.comment}", 
        common_build=test_run.builds, 
        result=test_run.result.name, 
        env_issue_type=test_run.env_issue_type.name,
        token=token
    )


def try_to_analyze_test_run(test_run: TestRun, fail_message_types: List[FailMessageType], first_lines_to_match: int=3, token: str=None):
    fail_message_type, line_no = match_fail_message_type(fail_message=test_run.fail_message, fail_message_types=fail_message_types)
    if fail_message_type and line_no <= first_lines_to_match:
        test_run.result = utils.get_env_issue_result_instance()
        test_run.env_issue_type = fail_message_type.env_issue_type
        test_run.comment = fail_message_type.name
        test_run.analyzed = True
        test_run.analyzed_by = utils.get_autoanalyzer_user()
        send_testrun_analysis_to_rp(test_run, token)
    return test_run


def create_testrun_obj_based_on_rp_data(rp_test_run: Dict, ignore_old_testruns: bool=True):
    def return_empty_if_none(elem):
        return elem if elem is not None else ""

    def _strip_time(value: str):
        return datetime.strptime(value.split(".")[0], '%Y-%m-%dT%H:%M:%S')

    rp_id = rp_test_run["id"]
    if TestRun.objects.filter(rp_id=rp_id).exists():
        raise TestRunWithSuchRPIDAlreadyExists(rp_id)

    start = utils.get_timezone_aware_datetime(_strip_time(rp_test_run["start"]))
    end = utils.get_timezone_aware_datetime(_strip_time(rp_test_run["end"]))
    
    fb_name, fb_start, fb_end = utils.get_fb_info_based_on_date(end)
    if ignore_old_testruns:
        utils.check_if_testrun_is_older_than_3_fbs(rp_id, end, exception=TestRunFBOlderThan3ConsecFBs)
        
    fb, _ = FeatureBuild.objects.get_or_create(name=fb_name, start_time=fb_start, end_time=fb_end)
    
    test_set_filter = TestSetFilter.objects.get(
        test_set_name=rp_test_run["qc_test_set"],
        test_lab_path=rp_test_run["qc_test_instance"].get("m_path", "")
    )
    test_instance, _ = TestInstance.objects.get_or_create(
        test_set=test_set_filter,
        test_case_name=rp_test_run["test_case"]["name"]
    )
    testline_type, _ = TestlineType.objects.get_or_create(
        name=return_empty_if_none(rp_test_run['test_col']["testline_type"])
    )
    organization, _ = Organization.objects.get_or_create(
        name=return_empty_if_none(rp_test_run["qc_test_instance"]["organization"])
    )
    env_issue_type, _ = EnvIssueType.objects.get_or_create(
        name=return_empty_if_none(rp_test_run["env_issue_type"])
    )
    result, _ = TestRunResult.objects.get_or_create(name=rp_test_run["result"])
    hyperlink_set = rp_test_run.get("hyperlink_set", "")
    if hyperlink_set:
        ute_exec_url=rp_test_run["hyperlink_set"].get("test_logs_url", [""])[0]
        log_file_url=rp_test_run["hyperlink_set"].get("log_file_url", "")
    else:
        ute_exec_url, log_file_url = "", ""
    tr = TestRun(
        rp_id=rp_id,
        fb=fb,
        test_instance=test_instance,
        testline_type=testline_type,
        organization=organization,
        result=result,
        env_issue_type=env_issue_type,
        comment=rp_test_run["comment"],
        fail_message=rp_test_run["fail_message"],
        test_line=rp_test_run["test_line"],
        test_suite=rp_test_run["test_suite"],
        builds=rp_test_run["builds"],
        airphone=rp_test_run["airphone"],
        ute_exec_url=ute_exec_url,
        log_file_url=log_file_url,
        # log_file_url_ext
        start_time=start,
        end_time=end,
    )
    return tr


def pull_notanalyzed_and_envissue_testruns_by_testset_filter(testset_filter_id: int, try_to_analyze: bool=True, query_limit: int=None):
    def _create_testrun_and_handle_its_actions_based_on_its_result(test_run):
        try:
            tr = create_testrun_obj_based_on_rp_data(test_run, ignore_old_testruns=True)
            not_analyzed = utils.get_not_analyzed_result_instance()
            if try_to_analyze and testset_filter and (tr.result == not_analyzed):
                tr = try_to_analyze_test_run(test_run=tr, fail_message_types=fail_message_types, token=token)

            tr.save()
            new_runs.append(tr.rp_id)

        except TestRunWithSuchRPIDAlreadyExists as exc_rp_id:
            skipped_runs.append(str(exc_rp_id))
            utils.log_exception_info(exc_rp_id)

        except TestRunFBOlderThan3ConsecFBs as e:
            utils.log_exception_info(e)


    testset_filter = TestSetFilter.objects.get(id=testset_filter_id)
    filters = utils.get_filters_for_rp_api(testrun_result="not analyzed,environment issue", testset_filter=testset_filter)
    if not query_limit:
        query_limit = testset_filter.limit

    new_runs, skipped_runs = [], []
    token = utils.try_to_get_rp_api_token_from_testset_filter_owners(testset_filter)

    if try_to_analyze and testset_filter:
        fail_message_types = get_fail_message_types_from_testset_filter(testset_filter)

    test_runs_data = RepPortal(token=token).get_data_from_testruns(limit=query_limit, filters=filters)
    for test_run in test_runs_data:
        _create_testrun_and_handle_its_actions_based_on_its_result(test_run)
    return {'new_runs': new_runs, 'skipped_runs': skipped_runs}


def pull_passed_testruns_by_testset_filter(testset_filter_id: int, query_limit: int=None):
    def _create_testrun_and_handle_its_actions_based_on_its_result(test_run):
        try:
            tr = create_testrun_obj_based_on_rp_data(test_run, ignore_old_testruns=True)
            if tr.has_ute_logs_available():
                tr.save()
                new_runs.append(tr.rp_id)
            else:
                skipped_runs.append(tr.rp_id)

        except TestRunWithSuchRPIDAlreadyExists as exc_rp_id:
            skipped_runs.append(str(exc_rp_id))
            utils.log_exception_info(e)

        except TestRunFBOlderThan3ConsecFBs as e:
            utils.log_exception_info(e)


    testset_filter = TestSetFilter.objects.get(id=testset_filter_id)
    filters = utils.get_filters_for_rp_api(testrun_result="passed", testset_filter=testset_filter)
    if not query_limit:
        query_limit = testset_filter.limit

    new_runs, skipped_runs = [], []
    token = utils.try_to_get_rp_api_token_from_testset_filter_owners(testset_filter)

    test_runs_data = RepPortal(token=token).get_data_from_testruns(limit=query_limit, filters=filters)
    for test_run in test_runs_data:
        _create_testrun_and_handle_its_actions_based_on_its_result(test_run)
    return {'new_runs': new_runs, 'skipped_runs': skipped_runs}


def download_latest_passed_logs_to_storage():
    testset_filters = TestSetFilter.objects.all()
    tsf_dict = {}
    for testset_filter in testset_filters:
        if testset_filter.is_subscribed_by_anyone(): 
            info = download_latest_passed_logs_to_storage_by_testset_filter(testset_filter.id)
            tsf_dict[testset_filter.id] = info
        else:
            tsf_dict[testset_filter.id] = "Not subscribed by anyone"
    return tsf_dict


def download_latest_passed_logs_to_storage_by_testset_filter(testset_filter_id: int):
    testset_filter = TestSetFilter.objects.get(id=testset_filter_id)
    test_instances = testset_filter.test_instances.all()
    log_inst_info_dict = {}
    for test_instance in test_instances:
        latest_test_run = test_instance.test_runs.all().filter(result=utils.get_passed_result_instance()).order_by('-end_time').first()
        ute_cloud_sr_id = utils.get_testrun_ute_cloud_sr_execution_id(latest_test_run)
        
        if test_instance.has_last_passing_logs_set():
            if test_instance.last_passing_logs.utecloud_run_id == ute_cloud_sr_id:
                continue

        logs_instance, created = LastPassingLogs.objects.get_or_create(
            utecloud_run_id=ute_cloud_sr_id,
            build=latest_test_run.builds,
            airphone=latest_test_run.airphone
        )

        log_inst_info_dict.setdefault(logs_instance.id, {
            "utecloud_run_id": ute_cloud_sr_id, 
            "ute_exec_url": latest_test_run.ute_exec_url,
            "test_instance_ids": []
            }
        )
        log_inst_info_dict[logs_instance.id]["test_instance_ids"].append(test_instance.id)

        # if created:
        #     celery_tasks.celery_download_resursively_contents_to_storage.delay(logs_instance.id, test_instance.id, )
        # else:
        #     test_instance.last_passing_logs = logs_instance
        #     test_instance.save()
    for logs_instance_id, info in log_inst_info_dict.items():
        utecloud_run_id = info["utecloud_run_id"]
        celery_tasks.celery_download_resursively_contents_to_storage.delay(
            lpl_id=logs_instance_id, 
            test_instance_ids=info["test_instance_ids"], 
            directory=f"tra/passed/{utecloud_run_id}", 
            url=info["ute_exec_url"]
        )
    
    return log_inst_info_dict


######################################################################
###########            FOR DEV PURPOSES USES ONLY          ###########
######################################################################

def pull_notanalyzed_and_envissue_testruns_by_all_testset_filters(query_limit: int=None):
    testset_filters = TestSetFilter.objects.all()
    tr_by_rf = {testset_filter.id: [] for testset_filter in testset_filters} 
    tr_by_rf_skipped = {testset_filter.id: [] for testset_filter in testset_filters} 
    for testset_filter in testset_filters:
        pull_stats = pull_notanalyzed_and_envissue_testruns_by_testset_filter(testset_filter_id=testset_filter.id, query_limit=query_limit)
        tr_by_rf[testset_filter.id] = pull_stats["loaded_new_runs"]
        tr_by_rf_skipped[testset_filter.id] = pull_stats["skipped_runs"]
    return {'loaded_new_runs': tr_by_rf, 'skipped_runs': tr_by_rf_skipped}