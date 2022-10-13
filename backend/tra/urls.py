from django.urls import path, include
from rest_framework import routers
from tra import views

router = routers.DefaultRouter()

# API to handle RegressionFilters model
# special actions: /owned            to display RegressionFilters that the user is the owner of
# special actions: /subscribed       to display RegressionFilters that the user is subscribed to
# special actions: /pk/subscribe/    to subscribe the current user to the specified regression filter
router.register(r'test_set_filters', views.TestSetFilterView, 'test_set_filters')

# API to handle FailMessageType model
# special actions: /my         to display FailMessageType objects that the user is the author of
router.register(r'fail_message_types', views.FailMessageTypeView, 'failmessagetypes')

# API to handle FailMessageTypeGroup model
# special actions: /my         to display FailMessageTypeGroup objects that the user is the author of
router.register(r'fail_message_type_groups', views.FailMessageTypeGroupView, 'failmessagetypegroups')
router.register(r'testline_types', views.TestlineTypeView, 'testline_types')
router.register(r'env_issue_types', views.EnvIssueTypeView, 'env_issue_types')
router.register(r'test_run_results', views.TestRunResultView, 'testrunresults')
router.register(r'test_runs', views.TestRunView, 'testruns')
router.register(r'branches', views.BranchView, 'branches')
router.register(r'last_passing_logs', views.LastPassingLogsView, 'last_passing_logs')
router.register(r'test_instances', views.TestInstanceView, 'test_instances')
router.register(r'notifications', views.NotificationView, 'notifications')

urlpatterns = [
    path('test_runs/by_query/', views.TestRunsBasedOnQuery.as_view(), name='tr_byquery'),
    path('test_instances/by_query/', views.TestInstancesBasedOnQuery.as_view(), name='ti_byquery'),
    path('test_runs/analyze_to_rp/', views.TestRunsAnalyzeToRP.as_view(), name='analyze_to_rp'),
    path('test_runs/dist_fields_values/', views.TestRunsBasedOnQueryDictinctValues.as_view(), name='distinct_fields_values'),
    path('summary/', views.SummaryStatisticsView.as_view(), name='summary_view'),

    path('test_runs/pull_notpassed_testruns_by_testset_filter/<int:tsfid>/', views.PullNotPassedTestrunsByTestSetFilter.as_view(), 
         name='pull_notpassed_testruns_by_testset_filter'),
    # additional parameter limit=<int> can be provided to override default limit specified by regression filter

    path('test_runs/pull_notpassed_testruns_by_all_testset_filters/', views.PullNotPassedTestrunsByAllTestSetFilters.as_view(), 
         name='pull_notpassed_testruns_by_all_testset_filters'),


    path('celery/pull_notpassed_testruns_by_all_testset_filters_celery/', views.PullNotPassedTestrunsByAllTestSetFiltersCelery.as_view(), 
         name='pull_notpassed_testruns_by_all_testset_filters_celery'),
    path('celery/pull_passed_testruns_by_all_testset_filters_celery/', views.PullPassedTestrunsByAllTestSetFiltersCelery.as_view(), 
         name='pull_passed_testruns_by_all_testset_filters_celery'),
    path('celery/pull_testruns_by_testsetfilters/', views.PullAllTestRunsBySelectedTestSetFiltersCelery.as_view(), 
         name='pull_testruns_by_testsetfilters'),
    path('celery/download_latest_passed_logs_to_storage/', views.DownloadLatestPassedLogsToStorage.as_view(), 
         name='download_latest_passed_logs_to_storage'),
    path('celery/remove_old_passed_logs_from_log_storage/', views.RemoveOldPassedLogsFromLogStorage.as_view(), 
         name='remove_old_passed_logs_from_log_storage'),
    path('celery/sync_suspension_status_of_test_instances_by_all_testset_filters/', views.SyncSuspensionStatusOfTestInstancesByAllTestSetFilters.as_view(), 
         name='sync_suspension_status_of_test_instances_by_all_testset_filters'),
    path('celery/fill_empty_test_instances_with_their_rp_ids/', views.FillEmptyTestInstancesWithTheirRPIds.as_view(), 
         name='fill_empty_test_instances_with_their_rp_ids'),
    path('celery/sync_norun_data_of_all_test_instances/', views.SyncNorunDataOfAllTestInstances.as_view(), 
         name='sync_norun_data_of_all_test_instances'),
    path('celery/get_task_status/', views.GetCeleryTasksStatus.as_view(), 
         name='get_task_status'),
    path('celery/check_all_tasks_status/', views.CheckIfAllTasksFinished.as_view(), 
         name='check_all_tasks_status'),
    
    
    path('', include(router.urls)),
]
