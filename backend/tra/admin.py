from django.contrib import admin
from .models import *


@admin.register(FeatureBuild)
class FeatureBuildAdmin(admin.ModelAdmin):
    list_display = ['name', 'start_time', 'end_time']
    list_filter = ['name']
    search_fields = ['name', 'start_time', 'end_time']


@admin.register(FailMessageType)
class FailMessageTypeAdmin(admin.ModelAdmin):
    list_display = ['regex', 'id', 'name', 'author', 'env_issue_type']
    list_filter = ['name', 'author', 'env_issue_type']
    search_fields = ['name', 'regex', 'author', 'env_issue_type__name']


class FailMessageTypeInline(admin.TabularInline):
    # model = FailMessageType
    model = FailMessageTypeGroup.fail_message_types.through 
    extra = 0
    # filter_horizontal = ('fail_message_types',)


@admin.register(FailMessageTypeGroup)
class FailMessageTypeGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'id', 'author',]
    list_filter = ['name', 'author']
    search_fields = ['name']
    inlines = [FailMessageTypeInline]


@admin.register(TestRunResult)
class TestRunResultAdmin(admin.ModelAdmin):
    list_display = ['name']
    list_filter = ['name']
    search_fields = ['name']


@admin.register(EnvIssueType)
class EnvIssueTypeAdmin(admin.ModelAdmin):
    list_display = ['name']
    list_filter = ['name']
    search_fields = ['name']


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name']
    list_filter = ['name']
    search_fields = ['name']


@admin.register(TestlineType)
class TestlineTypeAdmin(admin.ModelAdmin):
    list_display = ['name']
    list_filter = ['name']
    search_fields = ['name']


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ['name']
    list_filter = ['name']
    search_fields = ['name']


@admin.register(TestInstance)
class TestInstanceAdmin(admin.ModelAdmin):
    list_display = ['test_case_name', 'id', 'test_set', 'last_passing_logs', 'execution_suspended']
    list_filter = ['execution_suspended', 'test_set']
    search_fields = ['test_set__test_set_name', 'test_case_name']


@admin.register(TestRun)
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
        'airphone', 
        'fail_message', 
        'ute_exec_url', 
        'log_file_url',  
        'log_file_url_ext', 
        'start_time', 
        'end_time'
    ]
    list_filter = ['result', 'fb', 'testline_type', 'analyzed_by', 'test_suite', 'test_instance']
    search_fields = ['fail_message', 'result__name', 'env_issue_type__name', 'fb__name', 'rp_id']


@admin.register(RepPortalUserToken)
class RepPortalUserTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token']
    list_filter = []
    search_fields = ['user', 'token']


@admin.register(TestSetFilter)
class TestSetFilterAdmin(admin.ModelAdmin):
    list_display = ['test_set_name', 'id', 'test_lab_path', "branch", 'testline_type', 'limit']
    list_filter = ['test_set_name', 'testline_type', 'branch']
    search_fields = ['test_set_name', ]


@admin.register(LastPassingLogs)
class LastPassingLogsAdmin(admin.ModelAdmin):
    list_display = ['utecloud_run_id', 'location', 'id', 'url', 'size', 'build', 'airphone',]
    list_filter = ['build', 'airphone',]
    search_fields = ['location', 'url', 'build', 'utecloud_run_id']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['message', 'id', 'read', 'date']
    list_filter = ['read', ]
    search_fields = ['message', 'read', 'date']
