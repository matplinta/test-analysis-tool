from datetime import datetime
from time import sleep
from typing import List, Union

from celery import shared_task
from celery.result import AsyncResult
from celery.schedules import crontab
from celery.utils.log import get_task_logger
from django.conf import settings
from django.contrib.auth.models import User
from rep_portal.api import RepPortal, RepPortalError, RepPortalFieldNotFound
from constance import config

from backend.celery import app

from . import test_runs_processing, utils
from .models import *
from .storage import get_storage_instance, get_loghtml_storage_instance
logger = get_task_logger(__name__)


# if settings.DEBUG is False:
#     @app.on_after_finalize.connect
#     def setup_periodic_tasks(sender, **kwargs):
#         sender.add_periodic_task(crontab(hour=18, day_of_week=3),
#                                     celery_remove_old_feature_builds.s(),
#                                     name='celery_remove_old_feature_builds')
#         sender.add_periodic_task(crontab(minute=30, hour="*/4"),
#                                     celery_pull_notanalyzed_and_envissue_testruns_by_all_testset_filters.s(),
#                                     name='celery_pull_and_analyze_not_analyzed_test_runs_by_all_regfilters')
#         sender.add_periodic_task(crontab(minute=15, hour="*/4"),
#                                     celery_pull_passed_testruns_by_all_testset_filters.s(),
#                                     name='celery_pull_passed_testruns_by_all_testset_filters')
#         sender.add_periodic_task(crontab(minute=0, hour="21"),
#                                     celery_download_latest_passed_logs_to_storage.s(),
#                                     name='celery_download_latest_passed_logs_to_storage')
#         sender.add_periodic_task(crontab(minute=0, hour="23"),
#                                     celery_download_testrun_logs_to_mirror_storage.s(),
#                                     name='celery_download_testrun_logs_to_mirror_storage')
#         sender.add_periodic_task(crontab(minute=50, hour="*/4"),
#                                     celery_sync_suspension_status_of_test_instances_by_all_testset_filters.s(),
#                                     name='celery_sync_suspension_status_of_test_instances_by_all_testset_filters')
#         sender.add_periodic_task(crontab(minute=45, hour="*/4"),
#                                     celery_sync_norun_data_of_all_test_instances.s(),
#                                     name='celery_sync_norun_data_of_all_test_instances')
#         sender.add_periodic_task(crontab(minute=0, hour="6", day_of_week=1),
#                                     celery_remove_old_passed_logs_from_log_storage.s(),
#                                     name='celery_remove_old_passed_logs_from_log_storage')
#         sender.add_periodic_task(crontab(minute=30, hour="6", day_of_week=1),
#                                     celery_remove_mirrored_logs.s(),
#                                     name='celery_remove_mirrored_logs')


@app.task()
def celery_remove_old_feature_builds(keep_fb_threshold=None):
    """Keeps only the number (defined in keep_fb_threshold) of the newest fbs
    """
    if keep_fb_threshold is None:
        keep_fb_threshold = getattr(config, 'FB_TESTRUN_RETENTION', 3)
    fb_to_delete = FeatureBuild.objects.all()[keep_fb_threshold:]
    if fb_to_delete:
        for fb in fb_to_delete:
            fb.delete()


@app.task()
def celery_remove_old_passed_logs_from_log_storage():
    """Removes logs from passed executions when none test instances have last_passed_logs assigned to this instance"""
    removed_old = []
    removed_trash = []
    storage = get_storage_instance()
    unused_last_passing_logs = LastPassingLogs.objects.filter(test_instances__isnull=True)
    utecloud_run_ids_list = LastPassingLogs.objects.values_list("utecloud_run_id", flat=True)
    if storage.exists(''):
        dirs, _ = storage.listdir('')
        unaccounted_for_dirs = set(dirs).difference(set(utecloud_run_ids_list))
        for directory in unaccounted_for_dirs:
            storage.delete(directory)
            removed_trash.append(directory)

        for lpl in unused_last_passing_logs:
            storage.delete(lpl.location)
            removed_old.append(lpl.location)
            lpl.delete()

    return {"removed_trash": removed_trash, "removed_old": removed_old}


@app.task()
def celery_remove_mirrored_logs():
    """Removes logs from logs_html_mirror storage when none test run with matching execution_id is present in the DB"""
    storage = get_loghtml_storage_instance()
    removed = []
    if storage.exists(''):
        dirs, files = storage.listdir('')
        for directory in dirs:
            if directory and not TestRun.objects.filter(log_file_url_ext__contains=directory).exists():
                storage.delete(directory)
                removed.append(directory)

    return {"removed": removed}


@app.task()
def celery_pull_notanalyzed_and_envissue_testruns_by_all_testset_filters(query_limit: int=None):
    testset_filters = TestSetFilter.objects.all()
    status_response = {}
    for testset_filter in testset_filters:
        if testset_filter.is_subscribed_by_anyone():
            status_response[testset_filter.id] = "pull scheduled"
            celery_pull_notanalyzed_and_envissue_testruns_by_testset_filter.delay(testset_filter_id=testset_filter.id, query_limit=query_limit)
        else:
            status_response[testset_filter.id] = f"TestSetFilter.id: {testset_filter.id} has 0 subscribers - will be skipped"
    return status_response


@app.task()
def celery_pull_passed_testruns_by_all_testset_filters(query_limit: int=None):
    testset_filters = TestSetFilter.objects.all()
    status_response = {}
    for testset_filter in testset_filters:
        if testset_filter.is_subscribed_by_anyone():
            status_response[testset_filter.id] = "pull scheduled"
            celery_pull_passed_testruns_by_testset_filter.delay(testset_filter_id=testset_filter.id, query_limit=query_limit)
        else:
            status_response[testset_filter.id] = f"TestSetFilter.id: {testset_filter.id} has 0 subscribers - will be skipped"
    return status_response


@app.task()
def celery_sync_suspension_status_of_test_instances_by_all_testset_filters(query_limit: int=None):
    testset_filters = TestSetFilter.objects.all()
    status_response = {}
    for testset_filter in testset_filters:
        if testset_filter.is_subscribed_by_anyone():
            status_response[testset_filter.id] = "sync scheduled"
            celery_sync_suspension_status_of_test_instances_by_testset_filter.delay(testset_filter_id=testset_filter.id, limit=query_limit)
        else:
            status_response[testset_filter.id] = f"TestSetFilter.id: {testset_filter.id} has 0 subscribers - will be skipped"
    return status_response


@app.task()
def celery_sync_norun_data_of_all_test_instances():
    testset_filters = TestSetFilter.objects.exclude(subscribers=None)
    branches = set([tsf.branch for tsf in testset_filters])
    ti_eligible_to_sync_all = TestInstance.objects.none()
    for testset_filter in testset_filters:
        ti_eligible_to_sync_all = ti_eligible_to_sync_all | testset_filter.test_instances.all()
    organizations = set([ti.organization for ti in ti_eligible_to_sync_all])

    for organization in organizations:
        for branch in branches:
            ti_eligible_to_sync = ti_eligible_to_sync_all.filter(organization=organization, test_set__branch=branch)
            ti_eligible_ids = list(set([ti.rp_id for ti in ti_eligible_to_sync]))

            celery_sync_norun_data_per_organization_and_branch.delay(organization.name, branch.name)

    return {"organizations": [org.name for org in organizations], "branches": [bra.name for bra in branches], "ti_eligible_len": ti_eligible_to_sync_all.count()}


@app.task()
def celery_download_latest_passed_logs_to_storage():
    return test_runs_processing.download_latest_passed_logs_to_storage()


@app.task()
def celery_download_testrun_logs_to_mirror_storage():
    return test_runs_processing.download_testrun_logs_to_mirror_storage()


@shared_task(name="celery_pull_and_analyze_notanalyzed_testruns_by_testset_filter")
def celery_pull_notanalyzed_and_envissue_testruns_by_testset_filter(testset_filter_id, query_limit: int=None):
    return test_runs_processing.pull_notanalyzed_and_envissue_testruns_by_testset_filter(testset_filter_id=testset_filter_id, query_limit=query_limit)


@shared_task(name="celery_pull_passed_testruns_by_testset_filter")
def celery_pull_passed_testruns_by_testset_filter(testset_filter_id, query_limit: int=None):
    return test_runs_processing.pull_passed_testruns_by_testset_filter(testset_filter_id=testset_filter_id, query_limit=query_limit)


@shared_task(name="celery_sync_suspension_status_of_test_instances_by_testset_filter", bind=True, autoretry_for=(RepPortalError,), retry_backoff=True, retry_kwargs={'max_retries': 5})
def celery_sync_suspension_status_of_test_instances_by_testset_filter(self, testset_filter_id, limit=None):
    return test_runs_processing.sync_suspension_status_of_test_instances_by_testset_filter(testset_filter_id, limit)


@shared_task(name="celery_pull_testruns_by_testsetfilters")
def celery_pull_testruns_by_testsetfilters(testset_filters_ids, user_ids: Union[List[int], None]=None):
    def get_shortened_name(name):
        if len(name) < 35:
            return name
        else:
            return name[:32] + '...'
    tasks = []
    for tsf_id in testset_filters_ids:
        passed_task = celery_pull_passed_testruns_by_testset_filter.delay(testset_filter_id=int(tsf_id))
        na_env_task = celery_pull_notanalyzed_and_envissue_testruns_by_testset_filter.delay(testset_filter_id=int(tsf_id))
        tasks.append(passed_task.task_id)
        tasks.append(na_env_task.task_id)


    str_list_of_tsf_msg = ', '.join([f"{get_shortened_name(tsf.test_set_name)}: {tsf.branch.name}" for tsf in TestSetFilter.objects.filter(id__in=testset_filters_ids)])
    msg = f"Test runs for TestSetFilters: {str_list_of_tsf_msg} have successfully pulled data from the Reporting Portal!"
    if user_ids:
        while all([AsyncResult(taskid).ready() for taskid in tasks]) is not True:
            sleep(5)

        tasks_statuses = [AsyncResult(taskid).status for taskid in tasks]
        for user in User.objects.filter(id__in=user_ids):
            if all([status == "SUCCESS" for status in tasks_statuses]):
                Notification.objects.create(user=user, message=msg, date=datetime.now().replace(microsecond=0))
            else:
                msg = f"There was a problem with pulling of data from RP for the following TestSetFilters: {str_list_of_tsf_msg}. For details please contact admin."
                Notification.objects.create(user=user, message=msg, date=datetime.now().replace(microsecond=0))

        return {"msg": msg, "user_id": user.id}
    return {"msg": msg}


@shared_task(name="celery_analyze_testruns", bind=True, autoretry_for=(RepPortalError,), retry_backoff=True, retry_kwargs={'max_retries': 5})
def celery_analyze_testruns(self, runs, comment, common_build, result, env_issue_type, pronto="", send_to_qc=False, auth_params=None):
    if not auth_params:
        auth_params = utils.get_rp_api_auth_params()
    resp, url, data =  RepPortal(**auth_params).analyze_testruns(
        runs, comment, common_build, result, env_issue_type, pronto=pronto, send_to_qc=send_to_qc
    )
    if resp is None:
        return {"status": "failed", "url": url}
    return {"resp.text": resp.text, "resp.status_code": resp.status_code, "url": url}


@shared_task(name="celery_suspend_testinstances", bind=True, autoretry_for=(RepPortalError,), retry_backoff=True, retry_kwargs={'max_retries': 5})
def celery_suspend_testinstances(self, test_instances, suspend_status, auth_params=None):
    if not auth_params:
        auth_params = utils.get_rp_api_auth_params()
    resp, url, data =  RepPortal(**auth_params).set_suspension_status_for_test_instances(ti_ids=test_instances, suspend_status=suspend_status)
    if resp is None:
        return {"status": "failed", "url": url}

    TestInstance.objects.filter(rp_id__in=test_instances).update(execution_suspended=suspend_status)
    return {"resp.text": resp.text, "resp.status_code": resp.status_code, "url": url}


@shared_task(name="download_resursively_contents_to_storage")
def celery_download_resursively_contents_to_storage(lpl_id, test_instance_ids, directory, url):
    storage = get_storage_instance()
    resp = storage.save(name=directory, url=url)
    if resp:
        name = resp.get('name', directory)
        logs_instance = LastPassingLogs.objects.get(id=lpl_id)
        logs_instance.location = name
        logs_instance.url = storage.url(name)
        size = storage.size(name)
        if size == 0:
            storage.delete(name)
            logs_instance.delete()
            return {"resp": resp, "test_instance_ids": test_instance_ids,
                    "location": name, "url": storage.url(name), "size": size}
        else:
            logs_instance.size = size
            logs_instance.downloaded = True
            logs_instance.save()
            TestInstance.objects.filter(id__in=test_instance_ids).update(last_passing_logs=logs_instance)

    return {"resp": resp, "test_instance_ids": test_instance_ids}


@shared_task(name="download_logs_to_mirror_storage")
def celery_download_logs_to_mirror_storage(directory, url):
    if not directory:
        directory = utils.get_testrun_ute_cloud_sr_execution_id(url)
    storage = get_loghtml_storage_instance()
    resp = storage.save(name=directory, url=url)
    info = "Logs downloaded"
    saved_dirname = resp.get('name', directory)
    if saved_dirname and saved_dirname != "None":
        TestRun.objects.filter(execution_id=saved_dirname).update(log_file_url_ext=storage.url(saved_dirname))
    return {"resp": resp, "info": info}


@shared_task(name="sync_norun_data_per_organization_and_branch")
def celery_sync_norun_data_per_organization_and_branch(organization_name: int, branch_name: int):
    auth_params = utils.get_rp_api_auth_params()
    organization = Organization.objects.get(name=organization_name)
    branch = Branch.objects.get(name=branch_name)
    ti_eligible_to_sync = TestInstance.objects.exclude(test_set__subscribers=None).filter(organization=organization, test_set__branch=branch)
    ti_eligible_ids = set([ti.rp_id for ti in ti_eligible_to_sync])
    warn_msg = ""
    try:
        ti_noruns =  RepPortal(**auth_params).get_test_instances_for_present_feature_build_with_specified_status(
            organization.name, status="no_run", release=branch.name)
    except RepPortalFieldNotFound as e:
        ti_noruns = []
        warn_msg = repr(e)
    ti_noruns_ids = set([ti["id"] for ti in ti_noruns])
    ti_intersection = ti_eligible_ids.intersection(ti_noruns_ids)
    ti_difference = ti_eligible_ids.difference(ti_noruns_ids)
    TestInstance.objects.filter(rp_id__in=list(ti_difference)).update(no_run_in_rp=False)
    TestInstance.objects.filter(rp_id__in=list(ti_intersection)).update(no_run_in_rp=True)
    return {"warning_except": warn_msg ,"ti_noruns_len": len(ti_noruns_ids), "ti_intersection_len": len(ti_intersection),
            "ti_difference_len": len(ti_difference), "branch": branch.name, "organization": organization.name}
