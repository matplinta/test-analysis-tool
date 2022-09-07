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

urlpatterns = [
    # Filtering TestRuns queryset by the following fields:
    #     - reg_filters, fb, test_instance, result, env_issue_type, analyzed_by, analyzed, testline_type,
    # All fields should be referenced by their primary keys
    path('test_runs/by_query/', views.TestRunsBasedOnQuery.as_view(), name='byquery'),

    # test_runs/analyze_to_rp   
    #       send POST with the following keys:
    #            rp_ids             list of rp ids to analyze
    #            comment            comment
    #            result             result string
    #            env_issue_type     env issue type string
    path('test_runs/analyze_to_rp/', views.TestRunsAnalyzeToRP.as_view(), name='analyze_to_rp'),
    path('test_runs/dist_fields_values/', views.TestRunsBasedOnQueryDictinctValues.as_view(), name='distinct_fields_values'),

    path('test_runs/pull_notpassed_testruns_by_testset_filter/<int:tsfid>/', views.PullNotPassedTestrunsByTestSetFilter.as_view(), 
         name='pull_notpassed_testruns_by_testset_filter'),
    # additional parameter limit=<int> can be provided to override default limit specified by regression filter

    path('test_runs/pull_notpassed_testruns_by_all_testset_filters/', views.PullNotPassedTestrunsByAllTestSetFilters.as_view(), 
         name='pull_notpassed_testruns_by_all_testset_filters'),


    path('celery/pull_notpassed_testruns_by_all_testset_filters_celery/', views.PullNotPassedTestrunsByAllTestSetFiltersCelery.as_view(), 
         name='pull_notpassed_testruns_by_all_testset_filters_celery'),
    path('celery/pull_passed_testruns_by_all_testset_filters_celery/', views.PullPassedTestrunsByAllTestSetFiltersCelery.as_view(), 
         name='pull_passed_testruns_by_all_testset_filters_celery'),
    path('celery/download_latest_passed_logs_to_storage/', views.DownloadLatestPassedLogsToStorage.as_view(), 
         name='download_latest_passed_logs_to_storage'),
    path('celery/remove_old_passed_logs_from_log_storage/', views.RemoveOldPassedLogsFromLogStorage.as_view(), 
         name='remove_old_passed_logs_from_log_storage'),
    
    
    path('', include(router.urls)),
]
