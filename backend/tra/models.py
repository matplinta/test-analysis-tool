from django.db import models

from django.db import models
from django.contrib.auth.models import User
import re


class Organization(models.Model):
    name = models.CharField(primary_key=True, max_length=50, blank=False, unique=True)

    def __str__(self):
        return self.name


class EnvIssueType(models.Model):
    name = models.CharField(primary_key=True, max_length=200, blank=False, null=False, unique=True)

    def __str__(self):
        return self.name


class Branch(models.Model):
    name = models.CharField(primary_key=True, max_length=50, blank=False, unique=True)

    class Meta:
        verbose_name_plural = 'Branches'

    def __str__(self):
        return self.name


class TestRunResult(models.Model):
    name = models.CharField(primary_key=True, max_length=50, blank=False, unique=True)

    def __str__(self):
        return self.name


class TestlineType(models.Model):
    name = models.CharField(primary_key=True, max_length=255, blank=False, unique=True)

    def __str__(self):
        return self.name


class TestSet(models.Model):
    id             = models.BigAutoField(primary_key=True)
    name           = models.CharField(max_length=300, blank=False, null=True, help_text="QC Test Set")
    test_lab_path  = models.CharField(max_length=300, blank=False, null=True, help_text="Test Lab Path")
    branch         = models.ForeignKey(Branch, on_delete=models.CASCADE, blank=False, help_text="Branch, field set automatically")

    class Meta:
        constraints = [models.UniqueConstraint(fields=["name", "test_lab_path"], name='testset_uniq')]


    def __str__(self):
        return f"{self.name[:40]}... on {self.branch}"

    def save(self, *args, **kwargs):
        match = re.search(r'Root\\+Test_Sets\\+(\w+)\\+', self.test_lab_path)
        if match:
            branch = match.group(1)
        else:
            branch = None
        branch_instance, _ = Branch.objects.all().get_or_create(name=branch)
        self.branch = branch_instance
        super(TestSet, self).save(*args, **kwargs)


class TestInstance(models.Model):
    id                  = models.BigAutoField(primary_key=True)
    test_set            = models.ForeignKey(TestSet, on_delete=models.CASCADE, blank=False, help_text="Test set")
    test_case_name      = models.CharField(max_length=200, blank=False, null=True, help_text="Testcase name")
    execution_suspended = models.BooleanField(blank=True, default=False, null=True,  help_text="Execution suspended status")
    
    class Meta:
        constraints = [models.UniqueConstraint(fields=["test_set", "test_case_name"], name='testinstance_uniq')]

    def __str__(self):
        return f"{self.test_case_name[:40]}... on {self.test_set.branch}"


class TestRun(models.Model):
    id               = models.BigAutoField(primary_key=True, help_text="Internal TRA TestRun id")
    rp_id            = models.BigIntegerField(blank=False, null=True, help_text="Reporting Portal TestRun id")
    test_instance    = models.ForeignKey(TestInstance, on_delete=models.CASCADE, blank=False, help_text="Test instance")
    testline_type    = models.ForeignKey(TestlineType, on_delete=models.CASCADE, blank=False, help_text="Testline configuration")
    organization     = models.ForeignKey(Organization, on_delete=models.CASCADE, blank=True, help_text="Organization")
    result           = models.ForeignKey(TestRunResult, on_delete=models.CASCADE, blank=False, help_text="Testrun result")
    env_issue_type   = models.ForeignKey(EnvIssueType, on_delete=models.CASCADE, blank=True, help_text="Env issue type")

    fail_message     = models.CharField(max_length=1000, blank=True, null=True, help_text="Fail message")
    
    test_line        = models.CharField(max_length=100, blank=True, null=True, help_text="Testline")
    test_suite       = models.CharField(max_length=200, blank=False, null=True, help_text="Testsuite name")
    builds           = models.CharField(max_length=100, blank=False, null=True, help_text="Builds")
    ute_exec_url     = models.CharField(max_length=1000, blank=True, null=True, help_text="URL of ute execution details")
    log_file_url     = models.CharField(max_length=1000, blank=True, null=True, help_text="UTE Cloud log file url")
    log_file_url_ext = models.CharField(max_length=1000, blank=True, null=True, help_text="External log file url")
    start_time       = models.DateTimeField(blank=True, null=False, verbose_name='Start', help_text="Start time of testrun")
    end_time         = models.DateTimeField(blank=True, null=False, verbose_name='End', help_text="End time of testrun")
    analyzed         = models.BooleanField(blank=True, default=False, null=True,  help_text="Was test run analyzed in TRA")

    class Meta:
        ordering = ['-start_time']

    def __str__(self):
        return f"{self.test_instance.test_case_name[:40]} from {self.test_instance.test_set.branch}"


class TestsFilter(models.Model):
    id            = models.BigAutoField(primary_key=True)
    name          = models.CharField(max_length=50, blank=False, null=True, help_text="Name of test filter")
    user          = models.ForeignKey(User, on_delete=models.CASCADE)
    test_set      = models.ForeignKey(TestSet, on_delete=models.CASCADE, blank=False, help_text="Test set")
    testline_type = models.ForeignKey(TestlineType, on_delete=models.CASCADE, blank=True, help_text="Testline type")
    
    class Meta:
        constraints = [models.UniqueConstraint(fields=["test_set", "testline_type", "user"], name='test_set_type_uniq'),
                       models.UniqueConstraint(fields=["name", "user"], name='name_uniq')]
    
    def __str__(self):
        return self.name