from xmlrpc.client import boolean
from rep_portal.api import RepPortal, RepPortalError
import json
from datetime import datetime
import pytz
import logging
from typing import List, Dict, Tuple
from django.conf import settings
from itertools import chain
import re
from django.contrib.auth.models import User
from celery import shared_task

from .models import (
    FeatureBuild,
    get_fb_info_based_on_date,
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


class TestRunWithSuchRPIDAlreadyExists(Exception):
    pass


class TestRunFBOlderThan3ConsecFBs(Exception):
    pass


def get_fail_message_types_from_regfilter(regfilter: TestSetFilter) -> List[FailMessageType]:
    fmtgs = regfilter.fail_message_type_groups.all()
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


@shared_task(name="celery_analyze_testruns", bind=True, autoretry_for=(RepPortalError,), retry_backoff=True, retry_kwargs={'max_retries': 5})
def celery_analyze_testruns(self, runs, comment, common_build, result, env_issue_type, token=None):
    return RepPortal(token=token).analyze_testruns(runs, comment, common_build, result, env_issue_type)


def analyze_testrun_in_rp(test_run, token):
    analyzing_user = test_run.analyzed_by.username
    celery_analyze_testruns.delay(
        runs=[test_run.rp_id], 
        comment=f"Analyzed by user {analyzing_user}: {test_run.comment}", 
        common_build=test_run.builds, 
        result=test_run.result.name, 
        env_issue_type=test_run.env_issue_type.name,
        token=token
    )


def try_to_analyze_test_run(test_run: TestRun, fail_message_types: List[FailMessageType], first_lines_to_match: int = 3, token: str = None):
    fail_message_type, line_no = match_fail_message_type(fail_message=test_run.fail_message, fail_message_types=fail_message_types)
    if fail_message_type and line_no <= first_lines_to_match:
        env_issue, created = TestRunResult.objects.get_or_create(name="environment issue")
        test_run.result = env_issue
        test_run.env_issue_type = fail_message_type.env_issue_type
        test_run.comment = fail_message_type.name
        test_run.analyzed = True
        autouser, created = User.objects.get_or_create(username="autoanalyzer")
        test_run.analyzed_by = autouser

        analyze_testrun_in_rp(test_run, token)

    return test_run


def create_testrun_obj_based_on_rp_data(rp_test_run: Dict, pass_old_testruns: bool=True):
    def return_empty_if_none(elem):
        return elem if elem is not None else ""

    rp_id = rp_test_run["id"]
    if TestRun.objects.filter(rp_id=rp_id).exists():
        raise TestRunWithSuchRPIDAlreadyExists(rp_id)

    timezone = pytz.timezone(settings.TIME_ZONE)
    start = datetime.strptime(rp_test_run["start"].split(".")[0], '%Y-%m-%dT%H:%M:%S')
    start = timezone.localize(start)
    end = datetime.strptime(rp_test_run["end"].split(".")[0], '%Y-%m-%dT%H:%M:%S')
    end = timezone.localize(end)
    
    fb_name, fb_start, fb_end = get_fb_info_based_on_date(end)
    if not pass_old_testruns:
        if len(FeatureBuild.objects.all()) >= 3:
            if FeatureBuild.objects.all()[2].start_time > end:
                raise TestRunFBOlderThan3ConsecFBs(f"RPID: {rp_id}; this test run with time={end} is older than last 3 consecutive FeatureBuilds ({FeatureBuild.objects.all()[2].start_time})")
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
        ute_exec_url=rp_test_run["hyperlink_set"].get("test_logs_url", "")
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


def pull_test_runs_from_rp_to_db(limit, filters, try_to_analyze: boolean=False, regfilter: TestSetFilter=None):
    tr_list, tr_skipped_list = [], []
    token = None
    if regfilter:
        for user in regfilter.owners.all():
            if hasattr(user, 'rp_token') and user.rp_token.token:
                token = user.rp_token.token
    if try_to_analyze and regfilter:
        fail_message_types = get_fail_message_types_from_regfilter(regfilter)
    data = RepPortal(token=token).get_data_from_testruns(limit=limit, filters=filters)
    for test_run in data:
        try:
            tr = create_testrun_obj_based_on_rp_data(test_run, pass_old_testruns=False)
            not_analyzed = TestRunResult.objects.get_or_create(name="not analyzed")
            if try_to_analyze and regfilter and tr.result == not_analyzed:
                tr = try_to_analyze_test_run(test_run=tr, fail_message_types=fail_message_types, token=token)
            tr.save()
            tr_list.append(tr.rp_id)
        except TestRunWithSuchRPIDAlreadyExists as e:
            tr_skipped_list.append(str(e))
            logging.info(f"{type(e).__name__} was raised for rp_id={e}")
        except TestRunFBOlderThan3ConsecFBs as e:
            logging.info(f"{type(e).__name__} was raised for rp_id={e}")

    return {'loaded_new_runs': tr_list, 'skipped_runs': tr_skipped_list}


def pull_and_analyze_notanalyzed_testruns_by_regfilter(regression_filter_id: int, query_limit: int=None):
    regression_filter = TestSetFilter.objects.get(id=regression_filter_id)
    filters = {
        "result": "not analyzed,environment issue",
        "testline_type": regression_filter.testline_type.name,
        "test_set": regression_filter.test_set_name,
        "test_lab_path": regression_filter.test_lab_path
    }
    if not query_limit:
        query_limit = regression_filter.limit
    return pull_test_runs_from_rp_to_db(limit=query_limit, filters=filters, try_to_analyze=True, regfilter=regression_filter)


def pull_and_analyze_notanalyzed_testruns_by_all_regfilters(query_limit: int=None):
    regression_filters = TestSetFilter.objects.all()
    tr_by_rf = {regression_filter.id: [] for regression_filter in regression_filters} 
    tr_by_rf_skipped = {regression_filter.id: [] for regression_filter in regression_filters} 
    for regression_filter in regression_filters:
        pull_stats = pull_and_analyze_notanalyzed_testruns_by_regfilter(regression_filter_id=regression_filter.id, query_limit=query_limit)
        tr_by_rf[regression_filter.id] = pull_stats["loaded_new_runs"]
        tr_by_rf_skipped[regression_filter.id] = pull_stats["skipped_runs"]

    return {'loaded_new_runs': tr_by_rf, 'skipped_runs': tr_by_rf_skipped}