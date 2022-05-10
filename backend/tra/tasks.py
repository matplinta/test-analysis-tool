from celery.utils.log import get_task_logger
from celery import shared_task
from celery.schedules import crontab
from backend.celery import app
from .models import *
from .test_runs_processing import pull_and_analyze_notanalyzed_testruns_by_regfilter


logger = get_task_logger(__name__)


@app.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(300.0, test.s('hello AWD AWD AWD AWD'), name='Testing periodic tasks every 5 min')
    sender.add_periodic_task(crontab(hour=18, day_of_week=3), remove_old_feature_builds.s(), name='Delete older than last 3 FBs')
    # sender.add_periodic_task(crontab(minute=30, hour="*/6"), 
    sender.add_periodic_task(crontab(minute=24), 
                             celery_pull_and_analyze_not_analyzed_test_runs_by_all_regfilters.s(), 
                             name='celery_pull_and_analyze_not_analyzed_test_runs_by_all_regfilters')



@app.task
def test(arg):
    print(arg)


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
    regression_filters = RegressionFilter.objects.all()
    for regression_filter in regression_filters:
        celery_pull_and_analyze_notanalyzed_testruns_by_regfilter.delay(regression_filter_id=regression_filter.id, query_limit=query_limit)


@shared_task(name="celery_pull_and_analyze_notanalyzed_testruns_by_regfilter")
def celery_pull_and_analyze_notanalyzed_testruns_by_regfilter(regression_filter_id, query_limit: int=None):
    return pull_and_analyze_notanalyzed_testruns_by_regfilter(regression_filter_id=regression_filter_id, query_limit=query_limit)
