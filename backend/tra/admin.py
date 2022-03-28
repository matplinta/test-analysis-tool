from django.contrib import admin
from .models import TestSet, TestInstance, TestlineType, TestRun, TestsFilter


class TestlineTypeAdmin(admin.ModelAdmin):
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
    list_display = ['test_instance', 'testline_type', 'test_line', 'test_suite', 'organization', 'result', 
                    'env_issue_type', 'builds', 'fail_message', 'ute_exec_url', 'log_file_url',  
                    'log_file_url_ext', 'start_time', 'end_time']
    list_filter = ['result', 'test_instance', 'testline_type', 'test_suite']
    search_fields = ['fail_message', 'result', 'env_issue_type', ]


class TestsFilterAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'test_set', 'testline_type']
    list_filter = ['user', 'test_set', 'testline_type']
    search_fields = ['name', 'test_set']


admin.site.register(TestlineType, TestlineTypeAdmin)
admin.site.register(TestSet, TestSetAdmin)
admin.site.register(TestInstance, TestInstanceAdmin)
admin.site.register(TestRun, TestRunAdmin)
admin.site.register(TestsFilter, TestsFilterAdmin)