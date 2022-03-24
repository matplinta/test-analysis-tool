from django.db import models
from django.contrib.auth.models import User


class TestlineType(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255, blank=False, unique=True)

    def __str__(self):
        return self.name


class TestSet(models.Model):
    id             = models.BigAutoField(primary_key=True)
    name           = models.CharField(max_length=300, blank=False, null=True, help_text="QC Test Set")
    test_lab_path  = models.CharField(max_length=300, blank=False, null=True, help_text="Test Lab Path")
    branch         = models.CharField(max_length=100, blank=False, null=True, help_text="gNB Build Branch")

    def __str__(self):
        return f"{self.test_set} on {self.branch}"


class TestInstance(models.Model):
    id                  = models.BigAutoField(primary_key=True)
    test_set            = models.ForeignKey(TestSet, on_delete=models.CASCADE, blank=False, help_text="Test set")
    test_case_name      = models.CharField(max_length=200, blank=False, null=True, help_text="Testcase name")
    execution_suspended = models.BooleanField(blank=True, null=True,  help_text="Execution suspended status")
    
    def __str__(self):
        return f"{self.test_case_name} on {self.test_set.branch}"


class TestRun(models.Model):
    id               = models.BigAutoField(primary_key=True, help_text="Internal TRA TestRun id")
    test_instance    = models.ForeignKey(TestInstance, on_delete=models.CASCADE, blank=False, help_text="Test instance")
    testline_type    = models.ForeignKey(TestlineType, on_delete=models.CASCADE, blank=True, help_text="Testline configuration")
    
    test_line        = models.CharField(max_length=100, blank=True, null=True, help_text="Testline")
    test_suite       = models.CharField(max_length=200, blank=False, null=True, help_text="Testsuite name")
    organization     = models.CharField(max_length=50, blank=True, null=True, help_text="Organization")
    result           = models.CharField(max_length=20, blank=False, null=True, help_text="Result of the test run")
    env_issue_type   = models.CharField(max_length=200, blank=True, null=True, help_text="Env issue type")
    builds           = models.CharField(max_length=100, blank=False, null=True, help_text="Builds")
    fail_message     = models.CharField(max_length=1000, blank=True, null=True, help_text="Fail message")
    ute_exec_url     = models.CharField(max_length=1000, blank=True, null=True, help_text="URL of ute execution details")
    log_file_url     = models.CharField(max_length=1000, blank=True, null=True, help_text="UTE Cloud log file url")
    log_file_url_ext = models.CharField(max_length=1000, blank=True, null=True, help_text="External log file url")
    start_time       = models.TimeField(blank=True, null=False, verbose_name='Start', help_text="Start time of testrun")
    end_time         = models.TimeField(blank=True, null=False, verbose_name='End', help_text="End time of testrun")

    def __str__(self):
        return f"{self.test_case_name} from {self.test_instance.test_set.name}"


class TestsFilter(models.Model):
    id            = models.BigAutoField(primary_key=True)
    name          = models.CharField(max_length=50, blank=False, null=True, help_text="Name of test filter")
    user          = models.ForeignKey(User, on_delete=models.CASCADE)
    test_set      = models.ForeignKey(TestSet, on_delete=models.CASCADE, blank=False, help_text="Test set")
    testline_type = models.ForeignKey(TestlineType, on_delete=models.CASCADE, blank=True, help_text="Testline configuration")

    def __str__(self):
        return self.user