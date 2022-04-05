from django.contrib import admin
from .models import (
    TestSet, 
    TestInstance, 
    TestlineType,
    TestRun, 
    TestsFilter, 
    Branch, 
    Organization, 
    EnvIssueType, 
    TestRunResult,
    FailMessageType,
    FeatureBuild
)


class FeatureBuildAdmin(admin.ModelAdmin):
    list_display = ['name', 'start_time', 'end_time']
    list_filter = ['name']
    search_fields = ['name', 'start_time', 'end_time']


class FailMessageTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'regex']
    list_filter = ['name']
    search_fields = ['name', 'regex']


class TestRunResultAdmin(admin.ModelAdmin):
    list_display = ['name']
    list_filter = ['name']
    search_fields = ['name']


class EnvIssueTypeAdmin(admin.ModelAdmin):
    list_display = ['name']
    list_filter = ['name']
    search_fields = ['name']


class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name']
    list_filter = ['name']
    search_fields = ['name']


class TestlineTypeAdmin(admin.ModelAdmin):
    list_display = ['name']
    list_filter = ['name']
    search_fields = ['name']


class BranchAdmin(admin.ModelAdmin):
    list_display = ['name']
    list_filter = ['name']
    search_fields = ['name']


class TestSetAdmin(admin.ModelAdmin):
    list_display = ['name', 'test_lab_path', 'branch']
    list_filter = ['branch']
    search_fields = ['name', 'test_lab_path']


class TestInstanceAdmin(admin.ModelAdmin):
    list_display = ['test_set', 'test_case_name', 'execution_suspended']
    list_filter = ['execution_suspended']
    search_fields = ['test_set', 'test_case_name']


class TestRunAdmin(admin.ModelAdmin):
    list_display = [
        'rp_id', 
        'fb', 
        'test_instance', 
        'testline_type', 
        'test_line', 
        'test_suite',       
        'organization', 
        'result', 
        'analyzed', 
        'analyzed_by',
        'env_issue_type', 
        'builds', 
        'fail_message', 
        'ute_exec_url', 
        'log_file_url',  
        'log_file_url_ext', 
        'start_time', 
        'end_time'
    ]
    list_filter = ['result', 'test_instance', 'testline_type', 'test_suite', 'fb']
    search_fields = ['fail_message', 'result', 'env_issue_type', 'fb']


class TestsFilterAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'test_set', 'testline_type']
    list_filter = ['user', 'test_set', 'testline_type']
    search_fields = ['name', 'test_set']


admin.site.register(FeatureBuild, FeatureBuildAdmin)
admin.site.register(FailMessageType, FailMessageTypeAdmin)
admin.site.register(EnvIssueType, EnvIssueTypeAdmin)
admin.site.register(Organization, OrganizationAdmin)
admin.site.register(TestRunResult, TestRunResultAdmin)
admin.site.register(Branch, BranchAdmin)
admin.site.register(TestlineType, TestlineTypeAdmin)
admin.site.register(TestSet, TestSetAdmin)
admin.site.register(TestInstance, TestInstanceAdmin)
admin.site.register(TestRun, TestRunAdmin)
admin.site.register(TestsFilter, TestsFilterAdmin)