import datetime
import json
import logging
import os
from functools import reduce
from urllib.parse import urljoin, urlparse

import pytz
from dateutil import tz
from django.conf import settings
from django.contrib.auth.models import User, Group
from django.core.serializers import serialize
from django.db.models import Q
from constance import config

from .models import (Branch, EnvIssueType, FailMessageType,
                     FailMessageTypeGroup, FeatureBuild, Organization,
                     TestInstance, TestlineType, TestRun, TestRunResult,
                     TestSetFilter)
from .serializers import (BranchSerializer, EnvIssueTypeSerializer,
                          FailMessageTypeGroupSerializer,
                          FailMessageTypeSerializer, FeatureBuildSerializer,
                          LastPassingLogsSerializer, TestInstanceSerializer,
                          TestlineTypeSerializer, TestRunResultSerializer,
                          TestRunSerializer, TestSetFilterSerializer,
                          UserSerializer)


def get_timezone_aware_datetime(_datetime):
    timezone = pytz.timezone(settings.TIME_ZONE)
    return timezone.localize(_datetime)


def get_fb_info_based_on_date(test_datetime):
    fb_start = datetime.datetime(2022, 1, 5, 0, 0, 0, tzinfo=tz.gettz(settings.TIME_ZONE))
    if test_datetime.year < 2022:
        return "FB earlier than 2022 year", datetime.datetime.min, datetime.datetime.min
    fb_no = 1
    
    while True:
        fb_end = fb_start + datetime.timedelta(days=13, hours=23, minutes=59, seconds=59)
        if fb_start <= test_datetime <= fb_end:
            break
        else:
            fb_start_prev = fb_start
            fb_start = fb_start + datetime.timedelta(days=14)
            if fb_start_prev.year != fb_start.year:
                fb_no = 1
            else:
                fb_no += 1
    
    name = f"FB{str(fb_start.year)[-2:]}{fb_no:02d}"
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


def get_external_analyzer_user() -> User:
    extanalyzer, _ =  User.objects.get_or_create(username="external")
    return extanalyzer


def get_filters_for_rp_api(testrun_result: str, testset_filter: TestSetFilter):
    return {
        "result": testrun_result,
        "testline_type": ",".join([tl_type.name for tl_type in testset_filter.testline_types.all()]),
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


def get_rp_api_auth_params(testset_filter: TestSetFilter=None, token=None):
    if not token:
        token = try_to_get_rp_api_token_from_testset_filter_owners(testset_filter=testset_filter)
    return {"token": token, "user": config.RP_USER, "passwd": config.RP_PASSWORD, "debug": settings.DEBUG}



def log_exception_info(exception: Exception):
    logging.info(f"{type(exception).__name__} was raised for rp_id={exception}")


def get_testrun_ute_cloud_sr_execution_id(ute_exec_url: str):
    return os.path.basename(os.path.normpath(urlparse(ute_exec_url).path))


def get_distinct_values_based_on_subscribed_regfilters(user: User):
        fields_dict = {}
        def get_distinct_values_and_serialize(field, model, serializer=None, order_by_param=None, key_override=None):
            order_by_param = order_by_param if order_by_param else field
            distinct_values = queryset.order_by(order_by_param).distinct(field).values_list(field, flat=True)
            objects = model.objects.filter(pk__in=distinct_values)
            data = serialize("json", objects)
            key = field if not key_override else key_override
            fields_dict[key] = json.loads(data)

        queryset = TestRun.objects.all()
        tsfilters = TestSetFilter.objects.filter(subscribers=user)
        queryset = queryset.filter(
            reduce(lambda q, tsfilter: q | Q(test_instance__test_set=tsfilter), tsfilters, Q())
        )

        # fields_dict["tsfilters"] = json.loads(serialize("json", tsfilters))
        fields_dict['analyzed'] = queryset.order_by('analyzed').distinct('analyzed').values_list("analyzed", flat=True)
        fields_dict['exec_trigger'] = queryset.order_by('exec_trigger').distinct('exec_trigger').values_list("exec_trigger", flat=True)
        fields_dict['exec_trigger'] = sorted(["null" if elem is None else elem for elem in fields_dict['exec_trigger']])
        # get_distinct_values_and_serialize('test_instance', TestInstance, TestInstanceSerializer, order_by_param="test_instance_id")
        get_distinct_values_and_serialize('fb', FeatureBuild, FeatureBuildSerializer, order_by_param='fb__name')
        get_distinct_values_and_serialize('result', TestRunResult, TestRunResultSerializer)
        get_distinct_values_and_serialize('testline_type', TestlineType, TestlineTypeSerializer)
        get_distinct_values_and_serialize('env_issue_type', EnvIssueType, EnvIssueTypeSerializer)
        get_distinct_values_and_serialize('analyzed_by', User, UserSerializer)
        get_distinct_values_and_serialize('test_instance__test_set__branch', Branch, key_override="branch",
                                          order_by_param="test_instance__test_set__branch__name")
        test_set_distinct_values = tsfilters.order_by('test_set_name').distinct('test_set_name').values_list('test_set_name', flat=True)
        fields_dict['test_set_name'] = [{'pk': elem} for elem in list(test_set_distinct_values)]
        if not tsfilters.exists():
            return {key: [] for key in fields_dict.keys()}
        return fields_dict


def get_distinct_values_based_on_test_instance(test_instance: TestInstance):
        fields_dict = {}
        def get_distinct_values_and_serialize(field, model, serializer=None, order_by_param=None, key_override=None):
            order_by_param = order_by_param if order_by_param else field
            distinct_values = queryset.order_by(order_by_param).distinct(field).values_list(field, flat=True)
            objects = model.objects.filter(pk__in=distinct_values)
            data = serialize("json", objects)
            key = field if not key_override else key_override
            fields_dict[key] = json.loads(data)

        queryset = TestRun.objects.filter(test_instance=test_instance)
        fields_dict['analyzed'] = queryset.order_by('analyzed').distinct('analyzed').values_list("analyzed", flat=True)
        fields_dict['exec_trigger'] = queryset.order_by('exec_trigger').distinct('exec_trigger').values_list("exec_trigger", flat=True)
        fields_dict['exec_trigger'] = sorted(["null" if elem is None else elem for elem in fields_dict['exec_trigger']])
        get_distinct_values_and_serialize('fb', FeatureBuild, FeatureBuildSerializer, order_by_param='fb__name')
        get_distinct_values_and_serialize('result', TestRunResult, TestRunResultSerializer)
        get_distinct_values_and_serialize('testline_type', TestlineType, TestlineTypeSerializer)
        get_distinct_values_and_serialize('env_issue_type', EnvIssueType, EnvIssueTypeSerializer)
        get_distinct_values_and_serialize('analyzed_by', User, UserSerializer)
        return fields_dict


def get_common_users_group():
    instance, created = Group.objects.get_or_create(name='Common Users')
    # if created:

    return instance


def establish_testrun_test_entity_type(test_entity, param1, cit_cdrt_result, user_name, hyperlink_set):
    if user_name == "app_cloud_regression":
        if test_entity == "CRT":
            if param1 == "CDRT" and cit_cdrt_result == "CDRT":
                return "CDRT"
            else:
                return "CRT"
        elif test_entity == "CIT":
            if param1 == "CDRT":
                return "CDRT" if "CDRT" in cit_cdrt_result else "CIT"
            else:
                return "CIT"
        else:
            return cit_cdrt_result if cit_cdrt_result else "Other"
    else:
        if hyperlink_set:
            return "SingleRun"
        else:
            return "ManualRun"