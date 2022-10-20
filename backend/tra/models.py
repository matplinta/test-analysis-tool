from django.db import models
from django.contrib.auth.models import User
import re
from datetime import datetime, timedelta
from django.conf import settings
import pytz


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
        ordering = ['-name']

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


class FeatureBuild(models.Model):
    name = models.CharField(primary_key=True, max_length=20, blank=False, null=False, help_text="Feature Build name")
    start_time = models.DateTimeField(blank=False, null=False, verbose_name='Start', help_text="Start time of the feature build")
    end_time   = models.DateTimeField(blank=False, null=False, verbose_name='End', help_text="End time of the feature build")

    class Meta:
         ordering = ['-name']

    def __str__(self):
        return self.name


class FailMessageType(models.Model):
    id              = models.BigAutoField(primary_key=True)
    author          = models.ForeignKey(User, on_delete=models.CASCADE)
    name            = models.TextField(max_length=300, blank=False, null=False, help_text="Shortened name of failure message")
    regex           = models.TextField(max_length=500, blank=False, null=False, help_text="Failure message regex", unique=True)
    description     = models.TextField(max_length=500, blank=True, null=False, help_text="Description")
    env_issue_type  = models.ForeignKey(EnvIssueType, on_delete=models.CASCADE, blank=True, help_text="Environment issue type to set during analysis")

    class Meta:
        constraints = [models.UniqueConstraint(fields=["regex", "author"], name='regex_author_uniq')]

    def __str__(self):
        return self.regex


class FailMessageTypeGroup(models.Model):
    id                 = models.BigAutoField(primary_key=True)
    author             = models.ForeignKey(User, on_delete=models.CASCADE)
    name               = models.TextField(max_length=300, blank=False, null=False, help_text="Name of failure message group")
    fail_message_types = models.ManyToManyField(FailMessageType)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["name", "author"], name='fmtg_name_author_uniq')]

    def __str__(self):
        return self.name


class Notification(models.Model):
    id = models.BigAutoField(primary_key=True)
    message = models.TextField(blank=False, null=False, help_text="Message contents")
    read = models.BooleanField(blank=True, default=False,  help_text="Indication if the message was read by the user")
    date = models.DateTimeField(help_text="Date of message")
    user = models.ForeignKey(User, default=None, on_delete=models.CASCADE, related_name="notifications")

    class Meta:
        ordering = ['-date']


class LastPassingLogs(models.Model):
    id              = models.BigAutoField(primary_key=True)
    utecloud_run_id = models.BigIntegerField(unique=True)
    location        = models.CharField(max_length=200, blank=True, null=True, help_text="Last passing AirPhone build in TRA Storage")
    url             = models.TextField(blank=True, null=True, help_text="Last passing logs url to TRA http storage")
    size            = models.BigIntegerField(blank=True, null=True, help_text="Size of logs directory")
    build           = models.CharField(max_length=200, blank=True, null=True, help_text="Last passing build in TRA Storage")
    airphone        = models.CharField(max_length=200, blank=True, null=True, help_text="Last passing AirPhone build in TRA Storage")
    downloaded      = models.BooleanField(blank=True, null=True, default=False, help_text="Indicates if logs has been downloaded")

    class Meta:
        verbose_name_plural = 'Last passing logs'

    def __str__(self):
        return f"{self.id} - {self.location}"


class TestInstance(models.Model):
    id                  = models.BigAutoField(primary_key=True)
    rp_id               = models.BigIntegerField(unique=True, blank=True, null=True, help_text="ReportingPortal TestInstance Id")
    test_set            = models.ForeignKey("TestSetFilter", on_delete=models.CASCADE, blank=False, help_text="Test set", related_name="test_instances")
    test_case_name      = models.CharField(max_length=200, blank=False, null=True, help_text="Testcase name")
    execution_suspended = models.BooleanField(blank=True, default=False, null=True,  help_text="Execution suspended status")
    last_passing_logs   = models.ForeignKey(LastPassingLogs, default=None, on_delete=models.SET_NULL, blank=True, null=True, related_name="test_instances")
    organization        = models.ForeignKey(Organization, default=None, on_delete=models.SET_NULL, blank=True, null=True, related_name="test_instances")
    no_run_in_rp        = models.BooleanField(blank=True, default=False, null=True, help_text="No run status in ReportingPortal for the current Feature Build")
    
    class Meta:
        constraints = [models.UniqueConstraint(fields=["test_set", "test_case_name"], name='testinstance_uniq')]
        # ordering = ['-id']

    def __str__(self):
        return f"{self.test_case_name[:40]}... on {self.test_set.branch}"

    def has_last_passing_logs_set(self):
        return True if self.last_passing_logs else False

    def last_passing_logs_date_is_older_than(self, date):
        if self.has_last_passing_logs_set():
            return True if self.last_passing_logs.date < date else False
        else:
            return True


class TestRun(models.Model):
    id               = models.BigAutoField(primary_key=True, help_text="Internal TRA TestRun id")
    rp_id            = models.BigIntegerField(unique=True, blank=False, null=True, help_text="Reporting Portal TestRun id")
    test_instance    = models.ForeignKey(TestInstance, on_delete=models.CASCADE, blank=False, help_text="Test instance", related_name="test_runs")
    testline_type    = models.ForeignKey(TestlineType, on_delete=models.CASCADE, blank=False, help_text="Testline configuration")
    organization     = models.ForeignKey(Organization, on_delete=models.CASCADE, blank=True, help_text="Organization")
    result           = models.ForeignKey(TestRunResult, on_delete=models.CASCADE, blank=False, help_text="Testrun result")
    env_issue_type   = models.ForeignKey(EnvIssueType, on_delete=models.CASCADE, blank=True, help_text="Env issue type")
    fb               = models.ForeignKey(FeatureBuild, on_delete=models.CASCADE, blank=True, help_text="Feature Build")

    fail_message     = models.TextField(max_length=1000, blank=True, null=True, help_text="Fail message")
    comment          = models.TextField(max_length=1000, blank=True, null=True, help_text="Comment")
    test_line        = models.TextField(max_length=100, blank=True, null=True, help_text="Testline")
    test_suite       = models.TextField(max_length=200, blank=False, null=True, help_text="Testsuite name")
    builds           = models.TextField(max_length=100, blank=False, null=True, help_text="Builds")
    airphone         = models.TextField(max_length=100, blank=True, null=True, help_text="Airphone Build")
    ute_exec_url     = models.TextField(max_length=1000, blank=True, null=True, help_text="URL of ute execution details")
    log_file_url     = models.TextField(max_length=1000, blank=True, null=True, help_text="UTE Cloud log file url")
    log_file_url_ext = models.TextField(max_length=1000, blank=True, null=True, help_text="External log file url")
    start_time       = models.DateTimeField(blank=True, null=False, verbose_name='Start', help_text="Start time of testrun")
    end_time         = models.DateTimeField(blank=True, null=False, verbose_name='End', help_text="End time of testrun")
    analyzed         = models.BooleanField(blank=True, default=False, null=True,  help_text="Was test run analyzed in TRA")
    analyzed_by      = models.ForeignKey(User, default=None, on_delete=models.SET_NULL, blank=True, null=True)

    class Meta:
        ordering = ['-rp_id']

    def __str__(self):
        return f"{self.test_instance.test_case_name[:40]} from {self.test_instance.test_set.branch}"


    def has_ute_logs_available(self):
        timezone = pytz.timezone(settings.TIME_ZONE)
        now =  timezone.localize(datetime.now())
        return self.ute_exec_url and ( now - self.end_time <= timedelta(days=settings.UTE_LOGS_LIFESPAN)) 



class RepPortalUserToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name="rp_token")
    token = models.CharField(max_length=300, blank=False, null=True, help_text="RepPortal user specific token")

    def __str__(self):
        return self.user.username


class TestSetFilter(models.Model):
    id                       = models.BigAutoField(primary_key=True)
    limit                    = models.IntegerField(blank=False, default=50, 
                                                   help_text="Number of test runs pulled from Reporting Portal during every refresh")
    test_set_name            = models.TextField(max_length=300, blank=False, null=True, help_text="QC Test Set")
    test_lab_path            = models.TextField(max_length=300, blank=False, null=True, help_text="Test Lab Path")
    branch                   = models.ForeignKey(Branch, on_delete=models.CASCADE, blank=True, help_text="Branch, field set automatically")
    testline_type            = models.ForeignKey(TestlineType, on_delete=models.CASCADE, blank=False, help_text="Testline type")
    owners                   = models.ManyToManyField(User, related_name="owned_testsets", blank=True)
    subscribers              = models.ManyToManyField(User, related_name="subscribed_testsets", blank=True)
    fail_message_type_groups = models.ManyToManyField(FailMessageTypeGroup, blank=True)
    
    class Meta:
        constraints = [models.UniqueConstraint(fields=["test_set_name", "test_lab_path", "testline_type"], name='test_set_uniq_constr')]
        ordering = ['id']

    def __str__(self):
        return f"{self.branch} - {self.testline_type} - {self.test_set_name}"

    def is_subscribed_by_anyone(self):
        subs_count = self.subscribers.all().count()
        return False if subs_count == 0 else True

    def save(self, *args, **kwargs):
        match = re.search(r'Root\\+Test_Sets\\+(\w+)\\+', self.test_lab_path)
        if match:
            branch = match.group(1)
        else:
            branch = None
        branch_instance, _ = Branch.objects.all().get_or_create(name=branch)
        self.branch = branch_instance
        self.test_lab_path = self.test_lab_path.replace('\\\\', '\\')
        super(TestSetFilter, self).save(*args, **kwargs)