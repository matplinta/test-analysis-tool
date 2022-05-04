from xmlrpc.client import boolean
from rep_portal.api import RepPortal
import json
from datetime import datetime
import pytz
import logging
from typing import List, Dict, Tuple
from django.conf import settings
from itertools import chain
import re
from django.contrib.auth.models import User

from .models import (
    FailMessageTypeGroup,
    FeatureBuild,
    get_fb_info_based_on_date,
    Organization, 
    TestRunResult, 
    TestlineType, 
    TestSet, 
    TestInstance, 
    TestRun, 
    RegressionFilter, 
    EnvIssueType, 
    FailMessageType,
    FailMessageTypeGroup,
)


class TestRunWithSuchRPIDAlreadyExists(Exception):
    pass


def get_fail_message_types_from_regfilter(regfilter: RegressionFilter) -> List[FailMessageType]:
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


def try_to_analyze_test_run(test_run: TestRun, fail_message_types: List[FailMessageType]):
    fail_message_type, line_no = match_fail_message_type(fail_message=test_run.fail_message, fail_message_types=fail_message_types)
    if fail_message_type and line_no <= 3:
        env_issue, created = TestRunResult.objects.get_or_create(name="environment issue")
        test_run.result = env_issue
        test_run.env_issue_type = fail_message_type.env_issue_type
        test_run.comment = fail_message_type.name
        test_run.analyzed = True
        autouser, created = User.objects.get_or_create(username="autoanalyzer")
        test_run.analyzed_by = autouser
    return test_run


def create_testrun_obj_based_on_rp_data(rp_test_run: Dict, analyze=False):
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
    fb, _ = FeatureBuild.objects.get_or_create(name=fb_name, start_time=fb_start, end_time=fb_end)
    
    test_set, _ = TestSet.objects.get_or_create(
        name=rp_test_run["qc_test_set"],
        test_lab_path=rp_test_run["qc_test_instance"].get("m_path", "")
    )
    test_instance, _ = TestInstance.objects.get_or_create(
        test_set=test_set,
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
        ute_exec_url=ute_exec_url,
        log_file_url=log_file_url,
        # log_file_url_ext
        start_time=start,
        end_time=end,
        # analyzed
        )

    return tr


def pull_test_runs_from_rp_to_db(limit, filters, analyze: boolean=False, regfilter: RegressionFilter=None):
    tr_list, tr_skipped_list = [], []
    if analyze and regfilter:
        fail_message_types = get_fail_message_types_from_regfilter(regfilter)
    data = RepPortal().get_data_from_testruns(limit=limit, filters=filters)
    for test_run in data:
        try:
            tr = create_testrun_obj_based_on_rp_data(test_run)
            if analyze:
                tr = try_to_analyze_test_run(test_run=tr, fail_message_types=fail_message_types)
            tr.save()
            tr_list.append(tr.rp_id)
        except TestRunWithSuchRPIDAlreadyExists as e:
            tr_skipped_list.append(str(e))
            logging.info(f"{type(e).__name__} was raised for rp_id={e}")

    return {'loaded_new_runs': tr_list, 'skipped_runs': tr_skipped_list}


def pull_test_runs_by_regfilter(regression_filter: RegressionFilter, query_limit: int):
    
    limit = regression_filter.limit if query_limit is None else query_limit
    filters = {
        "result": "not analyzed",
        "testline_type": regression_filter.testline_type.name,
        "test_set": regression_filter.test_set.name,
        "test_lab_path": regression_filter.test_set.test_lab_path
    }
    return pull_test_runs_from_rp_to_db(limit=query_limit, filters=filters, analyze=True, regfilter=regression_filter)


def pull_test_runs_by_all_regfilters(query_limit: int):
    regression_filters = RegressionFilter.objects.all()
    tr_by_rf = {regression_filter.id: [] for regression_filter in regression_filters} 
    tr_by_rf_skipped = {regression_filter.id: [] for regression_filter in regression_filters} 
    for regression_filter in regression_filters:
        filters = {
            "result": "not analyzed",
            "testline_type": regression_filter.testline_type.name,
            "test_set": regression_filter.test_set.name,
            "test_lab_path": regression_filter.test_set.test_lab_path
        }
        pull_stats = pull_test_runs_from_rp_to_db(limit=query_limit, filters=filters, analyze=True, regfilter=regression_filter)
        tr_by_rf[regression_filter.id] = pull_stats["loaded_new_runs"]
        tr_by_rf_skipped[regression_filter.id] = pull_stats["skipped_runs"]

    return {'loaded_new_runs': tr_by_rf, 'skipped_runs': tr_by_rf_skipped}