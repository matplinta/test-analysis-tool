from celery.utils.log import get_task_logger
from celery import shared_task
from celery.schedules import crontab
from backend.celery import app
from django.conf import settings
from .models import *
from rep_portal.api import RepPortal, RepPortalError
from . import test_runs_processing
from .storage import get_storage_instance



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
def celery_analyze_testruns(self, runs, comment, common_build, result, env_issue_type, token=None):
    return RepPortal(token=token).analyze_testruns(runs, comment, common_build, result, env_issue_type)


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


# @shared_task(name="celery_fill_empty_test_instances_with_their_rp_ids")
# def celery_fill_empty_test_instances_with_their_rp_ids():
#     return test_runs_processing.fill_empty_test_instances_with_their_rp_ids()