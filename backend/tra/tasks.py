from celery.utils.log import get_task_logger
from celery import shared_task
from celery.schedules import crontab
from backend.celery import app
from .models import *
from .test_runs_processing import pull_and_analyze_notanalyzed_testruns_by_regfilter


logger = get_task_logger(__name__)


@app.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(crontab(hour=18, day_of_week=3), remove_old_feature_builds.s(), name='Delete older than last 3 FBs')
    sender.add_periodic_task(crontab(minute=30, hour="*/6"), 
                             celery_pull_and_analyze_not_analyzed_test_runs_by_all_regfilters.s(), 
                             name='celery_pull_and_analyze_not_analyzed_test_runs_by_all_regfilters')


@app.task()
def remove_old_feature_builds(keep_fb_threshold=3):
    """Keeps only the number (defined in keep_fb_threshold) of the newest fbs
    """
    fb_to_delete = FeatureBuild.objects.all()[keep_fb_threshold:]
    if fb_to_delete:
        for fb in fb_to_delete:
            fb.delete()


@app.task()
def celery_pull_and_analyze_not_analyzed_test_runs_by_all_regfilters(query_limit: int=None):
    regression_filters = TestSetFilter.objects.all()
    for regression_filter in regression_filters:
        subs_count = regression_filter.subscribers.all().count()
        celery_pull_and_analyze_notanalyzed_testruns_by_regfilter.delay(regression_filter_id=regression_filter.id, query_limit=query_limit, subs_count=subs_count)


@shared_task(name="celery_pull_and_analyze_notanalyzed_testruns_by_regfilter")
def celery_pull_and_analyze_notanalyzed_testruns_by_regfilter(regression_filter_id, query_limit: int=None, subs_count: int=0):
    if subs_count == 0:
        return f"Regression filter id:{regression_filter_id} has 0 subscribers - will be skipped" 
    return pull_and_analyze_notanalyzed_testruns_by_regfilter(regression_filter_id=regression_filter_id, query_limit=query_limit)
