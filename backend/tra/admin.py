from django.contrib import admin
from .models import (
    TestSet, 
    TestInstance, 
    TestlineType,
    TestRun, 
    RegressionFilter, 
    RepPortalUserToken,
    Branch, 
    Organization, 
    EnvIssueType, 
    TestRunResult,
    FailMessageType,
    FailMessageTypeGroup,
    FeatureBuild
)


class FeatureBuildAdmin(admin.ModelAdmin):
    list_display = ['name', 'start_time', 'end_time']
    list_filter = ['name']
    search_fields = ['name', 'start_time', 'end_time']


class FailMessageTypeAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'regex', 'author', 'env_issue_type']
    list_filter = ['name', 'author', 'env_issue_type']
    search_fields = ['name', 'regex', 'author', 'env_issue_type']


class FailMessageTypeInline(admin.TabularInline):
    # model = FailMessageType
    model = FailMessageTypeGroup.fail_message_types.through 
    extra = 0
    # filter_horizontal = ('fail_message_types',)


class FailMessageTypeGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'id', 'author',]
    list_filter = ['name', 'author']
    search_fields = ['name']
    inlines = [FailMessageTypeInline]


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
    list_display = ['test_case_name', 'id', 'test_set', 'execution_suspended']
    list_filter = ['execution_suspended', 'test_set']
    search_fields = ['test_set', 'test_case_name']


class TestRunAdmin(admin.ModelAdmin):
    list_display = [
        'id', 
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
        'comment', 
        'builds', 
        'fail_message', 
        'ute_exec_url', 
        'log_file_url',  
        'log_file_url_ext', 
        'start_time', 
        'end_time'
    ]
    list_filter = ['result', 'fb', 'testline_type', 'analyzed_by', 'test_suite', 'test_instance']
    search_fields = ['fail_message', 'result', 'env_issue_type', 'fb']


class RepPortalUserTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token']
    list_filter = []
    search_fields = ['user', 'token']


class RegressionFilterAdmin(admin.ModelAdmin):
    list_display = ['name', 'id', 'test_set', 'testline_type', 'limit']
    list_filter = ['test_set', 'testline_type']
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
admin.site.register(RepPortalUserToken, RepPortalUserTokenAdmin)
admin.site.register(RegressionFilter, RegressionFilterAdmin)
admin.site.register(FailMessageTypeGroup, FailMessageTypeGroupAdmin)