from typing import List, Set
from celery.utils.log import get_task_logger
from celery import shared_task
from celery.schedules import crontab
from backend.celery import app
from django.conf import settings
from .models import *
from rep_portal.api import RepPortal, RepPortalError
from . import test_runs_processing
from .storage import get_storage_instance
from . import utils



logger = get_task_logger(__name__)


if settings.DEBUG is False:
    @app.on_after_finalize.connect
    def setup_periodic_tasks(sender, **kwargs):
        sender.add_periodic_task(crontab(hour=18, day_of_week=3), celery_remove_old_feature_builds.s(), name='Delete older than last 3 FBs')
        sender.add_periodic_task(crontab(minute=30, hour="*/6"), 
                                 celery_pull_notanalyzed_and_envissue_testruns_by_all_testset_filters.s(), 
                                 name='celery_pull_and_analyze_not_analyzed_test_runs_by_all_regfilters')
        sender.add_periodic_task(crontab(minute=0, hour="6", day_of_week=1), 
                                 celery_remove_old_passed_logs_from_log_storage.s(), 
                                 name='celery_remove_old_passed_logs_from_log_storage')
        sender.add_periodic_task(crontab(minute=0, hour="20"), 
                                 celery_pull_passed_testruns_by_all_testset_filters.s(), 
                                 name='celery_pull_passed_testruns_by_all_testset_filters')
        sender.add_periodic_task(crontab(minute=0, hour="21"), 
                                 celery_download_latest_passed_logs_to_storage.s(), 
                                 name='celery_download_latest_passed_logs_to_storage')
        sender.add_periodic_task(crontab(minute=5, hour="*/8"), 
                                 celery_sync_suspension_status_of_test_instances_by_all_testset_filters.s(), 
                                 name='celery_sync_suspension_status_of_test_instances_by_all_testset_filters')
        sender.add_periodic_task(crontab(minute=35, hour="*/8"), 
                                 celery_sync_norun_data_of_all_test_instances.s(), 
                                 name='celery_sync_norun_data_of_all_test_instances')


@app.task()
def celery_remove_old_feature_builds(keep_fb_threshold=3):
    """Keeps only the number (defined in keep_fb_threshold) of the newest fbs
    """
    fb_to_delete = FeatureBuild.objects.all()[keep_fb_threshold:]
    if fb_to_delete:
        for fb in fb_to_delete:
            fb.delete()


@app.task()
def celery_remove_old_passed_logs_from_log_storage():
    """Removes logs from passed executions when none test instances have last_passed_logs assigned to this instance"""
    last_passing_logs = LastPassingLogs.objects.all()
    for lpl in last_passing_logs: 
        if not lpl.test_instances.all().exists():
            lpl.delete()


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


@shared_task(name="celery_pull_and_analyze_notanalyzed_testruns_by_testset_filter")
def celery_pull_notanalyzed_and_envissue_testruns_by_testset_filter(testset_filter_id, query_limit: int=None):
    return test_runs_processing.pull_notanalyzed_and_envissue_testruns_by_testset_filter(testset_filter_id=testset_filter_id, query_limit=query_limit)


@shared_task(name="celery_pull_passed_testruns_by_testset_filter")
def celery_pull_passed_testruns_by_testset_filter(testset_filter_id, query_limit: int=None):
    return test_runs_processing.pull_passed_testruns_by_testset_filter(testset_filter_id=testset_filter_id, query_limit=query_limit)


@shared_task(name="celery_sync_suspension_status_of_test_instances_by_testset_filter", bind=True, autoretry_for=(RepPortalError,), retry_backoff=True, retry_kwargs={'max_retries': 5})
def celery_sync_suspension_status_of_test_instances_by_testset_filter(self, testset_filter_id, limit=None):
    return test_runs_processing.sync_suspension_status_of_test_instances_by_testset_filter(testset_filter_id, limit)


@shared_task(name="celery_analyze_testruns", bind=True, autoretry_for=(RepPortalError,), retry_backoff=True, retry_kwargs={'max_retries': 5})
def celery_analyze_testruns(self, runs, comment, common_build, result, env_issue_type, auth_params=None):
    if not auth_params:
        auth_params = utils.get_rp_api_auth_params()
    resp, url, data =  RepPortal(**auth_params).analyze_testruns(runs, comment, common_build, result, env_issue_type)
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
            return {"resp": resp, "test_instance_ids": test_instance_ids, 
                    "location": name, "url": storage.url(name), "size": size}
        else:
            logs_instance.size = size
            logs_instance.downloaded = True
            logs_instance.save()
            TestInstance.objects.filter(id__in=test_instance_ids).update(last_passing_logs=logs_instance)
       
    return {"resp": resp, "test_instance_ids": test_instance_ids}


@shared_task(name="sync_norun_data_per_organization_and_branch")
def celery_sync_norun_data_per_organization_and_branch(organization_name: int, branch_name: int):
    auth_params = utils.get_rp_api_auth_params()
    organization = Organization.objects.get(name=organization_name)
    branch = Branch.objects.get(name=branch_name)
    ti_eligible_to_sync = TestInstance.objects.exclude(test_set__subscribers=None).filter(organization=organization, test_set__branch=branch)
    ti_eligible_ids = set([ti.rp_id for ti in ti_eligible_to_sync])

    ti_noruns =  RepPortal(**auth_params).get_test_instances_for_present_feature_build_with_specified_status(
        organization.name, status="no_run", release=branch.name)
    ti_noruns_ids = set([ti["id"] for ti in ti_noruns])
    ti_intersection = ti_eligible_ids.intersection(ti_noruns_ids)
    TestInstance.objects.filter(rp_id__in=list(ti_intersection)).update(no_run_in_rp=True)
    return {"ti_noruns_len": len(ti_noruns_ids), "ti_intersection_len": len(ti_intersection), "branch": branch.name, "organization": organization.name}