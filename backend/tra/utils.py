import os
import logging
import datetime
from typing import List
from urllib.parse import urlparse

import pytz
from constance import config
from dateutil import tz
from django.apps import apps
from django.conf import settings
from django.contrib.auth.models import Group, User

# from .models import (
#     Branch, EnvIssueType, FailMessageType,
#     FailMessageTypeGroup, FeatureBuild, Organization,
#     TestInstance, TestlineType, TestRun, TestRunResult,
#     TestSetFilter
# )



def _get_tra_model(model_name):
    return apps.get_model(f'tra.{model_name}')


def return_empty_if_none(elem):
    return elem if elem is not None else ""


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


def get_autoanalyzer_user() -> User:
    autoanalyzer, _ =  User.objects.get_or_create(username="autoanalyzer")
    return autoanalyzer


def get_external_analyzer_user() -> User:
    extanalyzer, _ =  User.objects.get_or_create(username="external")
    return extanalyzer


def get_common_users_group():
    instance, _ = Group.objects.get_or_create(name='Common Users')
    return instance


def get_rp_api_auth_params(testset_filter=None, token=None):
    if not token:
        if testset_filter:
            token = testset_filter.try_to_get_rp_api_token_from_testset_filter_owners()
    return {
        "token": token,
        "user": config.RP_USER,
        "passwd": config.RP_PASSWORD,
        "debug": settings.DEBUG,
        "rp_url": config.RP_URL
    }


def log_exception_info(exception: Exception, rp_id=None):
    error_msg = f"{type(exception).__name__} was raised"
    if rp_id:
        error_msg += f" for rp_id={rp_id}"
    logging.info(error_msg)


def get_testrun_ute_cloud_sr_execution_id(ute_exec_url: str):
    return os.path.basename(os.path.normpath(urlparse(ute_exec_url).path))
