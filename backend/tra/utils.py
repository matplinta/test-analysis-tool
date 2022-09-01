from django.contrib.auth.models import User
from dateutil import tz
from urllib.parse import urlparse, urljoin
import datetime
import logging
import os
import pytz
from django.conf import settings

from .models import (
    FeatureBuild,
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


def get_timezone_aware_datetime(_datetime):
    timezone = pytz.timezone(settings.TIME_ZONE)
    return timezone.localize(_datetime)


def get_fb_info_based_on_date(test_datetime):
    fb_start = datetime.datetime(2022, 1, 5, 0, 0, 0, tzinfo=tz.gettz(settings.TIME_ZONE))
    if test_datetime.year < 2022:
        return "FB earlier than 2022 year", datetime.datetime.min, datetime.datetime.min
    while fb_start.year != test_datetime.year:
        fb_start = fb_start + datetime.timedelta(days=14)

    fb_no = 1
    while True:
        fb_end = fb_start + datetime.timedelta(days=13, hours=23, minutes=59, seconds=59)
        if fb_start < test_datetime < fb_end:
            break
        else:
            fb_no += 1
            fb_start = fb_start + datetime.timedelta(days=14)
    name = f"FB{str(test_datetime.year)[-2:]}{fb_no:02d}"
    return name, fb_start, fb_end

def check_if_testrun_is_older_than_3_fbs(rp_id: int, end: datetime.datetime, exception: Exception):
    if len(FeatureBuild.objects.all()) >= 3:
        if FeatureBuild.objects.all()[2].start_time > end:
            raise exception(f"RPID: {rp_id}; this test run with time={end} is older than last 3 consecutive FeatureBuilds ({FeatureBuild.objects.all()[2].start_time})")


def get_env_issue_result_instance() -> TestRunResult:
    env_issue, _ = TestRunResult.objects.get_or_create(name="environment issue")
    return env_issue

def get_not_analyzed_result_instance() -> TestRunResult:
    not_analyzed, _ = TestRunResult.objects.get_or_create(name="not analyzed")
    return not_analyzed


def get_passed_result_instance() -> TestRunResult:
    passed, _ = TestRunResult.objects.get_or_create(name="passed")
    return passed


def get_autoanalyzer_user() -> User:
    autoanalyzer, _ =  User.objects.get_or_create(username="autoanalyzer")
    return autoanalyzer


def get_filters_for_rp_api(testrun_result: str, testset_filter: TestSetFilter):
    return {
        "result": testrun_result,
        "testline_type": testset_filter.testline_type.name,
        "test_set": testset_filter.test_set_name,
        "test_lab_path": testset_filter.test_lab_path
    }


def try_to_get_rp_api_token_from_testset_filter_owners(testset_filter: TestSetFilter=None):
    token = None
    if testset_filter:
        for user in testset_filter.owners.all():
            if hasattr(user, 'rp_token') and user.rp_token.token:
                token = user.rp_token.token
    return token


def log_exception_info(exception: Exception):
    logging.info(f"{type(exception).__name__} was raised for rp_id={exception}")


def get_testrun_ute_cloud_sr_execution_id(test_run: TestRun):
    return os.path.basename(os.path.normpath(urlparse(test_run.ute_exec_url).path))