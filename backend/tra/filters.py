from django_filters import rest_framework as filters
from functools import reduce
from django.contrib.auth.models import User
from django.db.models import Q
from .models import (
    FailMessageTypeGroup,
    FeatureBuild,
    get_fb_info_based_on_date,
    Organization, 
    TestRunResult, 
    TestlineType, 
    TestSet, 
    TestInstance, 
    TestRun, 
    RegressionFilter, 
    EnvIssueType, 
    FailMessageType,
    FailMessageTypeGroup,
)

class TestRunFilter(filters.FilterSet):
    reg_filters = filters.ModelMultipleChoiceFilter(
        field_name='reg_filters',
        queryset=RegressionFilter.objects.all(),
        method='reg_filter_filter_method'
    )

    def reg_filter_filter_method(self, queryset, name, value):
        reg_filters = value
        queryset = queryset.filter(
            reduce(lambda q, reg_filter: q | Q(testline_type=reg_filter.testline_type, 
                                               test_instance__test_set=reg_filter.test_set), reg_filters, Q())
        )
        return queryset

    test_instance = filters.ModelMultipleChoiceFilter(field_name='test_instance', queryset=TestInstance.objects.all())
    fb = filters.ModelMultipleChoiceFilter(field_name='fb', queryset=FeatureBuild.objects.all())
    result = filters.ModelMultipleChoiceFilter(field_name='result', queryset=TestRunResult.objects.all())
    testline_type = filters.ModelMultipleChoiceFilter(field_name='testline_type', queryset=TestlineType.objects.all())
    env_issue_type = filters.ModelMultipleChoiceFilter(field_name='env_issue_type', queryset=EnvIssueType.objects.all())
    analyzed_by = filters.ModelMultipleChoiceFilter(field_name='analyzed_by__username', to_field_name="username", queryset=User.objects.all())
    analyzed = filters.BooleanFilter()

    class Meta:
        model = TestRun
        fields = ["test_instance", "fb", "result", "testline_type", "env_issue_type", "analyzed", "analyzed_by"] 