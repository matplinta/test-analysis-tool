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
# router.register(r'fail_message_type_groups_ro', views.FailMessageTypeGroupROView, 'failmessagetypegroupsro')

# API to handle TestlineType model
router.register(r'testline_types', views.TestlineTypeView, 'testline_types')

# API to handle EnvIssueType model
router.register(r'env_issue_types', views.EnvIssueTypeView, 'testline_types')

# API to handle TestRunResult model
router.register(r'test_run_results', views.TestRunResultView, 'testrunresults')

# API to handle TestRun model
router.register(r'test_runs', views.TestRunView, 'testruns')

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
    # path('test_runs/by_reg_filter/<int:rfid>/', views.TestRunsBasedOnRegressionFiltersView.as_view(), name='by_reg_filter_pk'),

    path('test_runs/load_by_reg_filter/<int:rfid>/', views.LoadTestRunsToDBBasedOnRegressionFilter.as_view(), name='load_filtered_trs'),
    # additional parameter limit=<int> can be provided to override default limit specified by regression filter

    path('test_runs/load_by_all_reg_filter/', views.LoadTestRunsToDBBasedOnAllRegressionFilters.as_view(), name='load_filtered_trs_by_all_rf'),
    path('test_runs/load_by_all_reg_filter_celery/', views.LoadTestRunsToDBBasedOnAllRegressionFiltersCelery.as_view(), name='load_filtered_trs_by_all_rf_celery'),
    path('', include(router.urls)),
]
