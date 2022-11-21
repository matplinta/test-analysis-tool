from functools import reduce

from django.contrib.auth.models import User
from django.db.models import Q
from django_filters import rest_framework as filters

from .models import (Branch, EnvIssueType, FailMessageType,
                     FailMessageTypeGroup, FeatureBuild, Organization,
                     TestInstance, TestlineType, TestRun, TestRunResult,
                     TestSetFilter)


class TestRunFilter(filters.FilterSet):
    reg_filters = filters.ModelMultipleChoiceFilter(
        field_name='reg_filters',
        queryset=TestSetFilter.objects.all(),
        method='reg_filter_filter_method'
    )

    def reg_filter_filter_method(self, queryset, name, value):
        tsfilters = value
        queryset = queryset.filter(
            reduce(lambda q, tsfilter: q | Q(test_instance__test_set=tsfilter.test_set), tsfilters, Q())
        )
        return queryset

    test_set_name = filters.ModelMultipleChoiceFilter(field_name='test_instance__test_set__test_set_name', queryset=TestSetFilter.objects.all(), to_field_name="test_set_name")
    branch = filters.ModelMultipleChoiceFilter(field_name='test_instance__test_set__branch__name', queryset=Branch.objects.all(), to_field_name="name")
    test_instance = filters.ModelMultipleChoiceFilter(field_name='test_instance', queryset=TestInstance.objects.all())
    fb = filters.ModelMultipleChoiceFilter(field_name='fb', queryset=FeatureBuild.objects.all())
    result = filters.ModelMultipleChoiceFilter(field_name='result', queryset=TestRunResult.objects.all())
    testline_type = filters.ModelMultipleChoiceFilter(field_name='testline_type', queryset=TestlineType.objects.all())
    env_issue_type = filters.ModelMultipleChoiceFilter(field_name='env_issue_type', queryset=EnvIssueType.objects.all())
    analyzed_by = filters.ModelMultipleChoiceFilter(field_name='analyzed_by__username', to_field_name="username", queryset=User.objects.all())
    analyzed = filters.BooleanFilter()

    class Meta:
        model = TestRun
        fields = ["test_instance", "fb", "result", "testline_type", "env_issue_type", "analyzed", "analyzed_by",
            'test_set_name', 'branch', 
        ] 


class TestInstanceFilter(filters.FilterSet):
    class Meta:
        model = TestInstance
        fields = {
            'rp_id': ['exact', 'in'],
            'test_set__test_set_name': ['icontains'],
            'test_set__test_lab_path': ['icontains'],
            'test_set__branch__name': ['icontains'],
            'testline_type__name': ['icontains'],
            # 'last_passing_logs__utecloud_run_id': ['exact'],
            'test_case_name': ['icontains'],
            'organization__name': ['icontains'],
            'execution_suspended': ['exact'],
            'no_run_in_rp': ['exact'],
        }
