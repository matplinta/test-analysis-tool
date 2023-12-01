import re
from datetime import datetime, timedelta
from itertools import chain
from typing import List, Dict

import pytz
from constance import config
from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from django.forms import ValidationError

from . import utils


class Organization(models.Model):
    name = models.CharField(primary_key=True, max_length=50, blank=False, unique=True)

    def __str__(self):
        return str(self.name)


class EnvIssueType(models.Model):
    name = models.CharField(primary_key=True, max_length=200, blank=False, null=False, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return str(self.name)


class Branch(models.Model):
    name = models.CharField(primary_key=True, max_length=50, blank=False, unique=True)

    class Meta:
        verbose_name_plural = 'Branches'
        ordering = ['-name']

    def __str__(self):
        return str(self.name)


class TestRunResultManager(models.Manager):
    SUPPORTED_TESTRUN_RESULTS = (
        "environment issue",
        "not analyzed",
        "passed",
        "failed",
        "blocked"
    )
    def _save_get_instance(self, name):
        inst, _ = self.get_or_create(name=name)
        return inst

    def get_env_issue_instance(self) -> "TestRunResult":
        return self._save_get_instance(name="environment issue")

    def get_not_analyzed_instance(self) -> "TestRunResult":
        return self._save_get_instance(name="not analyzed")

    def get_passed_instance(self) -> "TestRunResult":
        return self._save_get_instance(name="passed")

    def get_failed_instance(self) -> "TestRunResult":
        return self._save_get_instance(name="failed")

    def get_blocked_instance(self) -> "TestRunResult":
        return self._save_get_instance(name="blocked")

    def get_list_of_result_names_other_than_passed(self):
        return list(self.exclude(name="passed").values_list("name", flat=True))

    def get_list_of_all_supported_result_names(self):
        return self.SUPPORTED_TESTRUN_RESULTS


class TestRunResult(models.Model):
    objects = TestRunResultManager()

    name = models.CharField(primary_key=True, max_length=50, blank=False, unique=True)

    def __str__(self):
        return str(self.name)


class TestlineType(models.Model):
    name = models.CharField(primary_key=True, max_length=255, blank=False, unique=True)

    def __str__(self):
        return str(self.name)


class FeatureBuild(models.Model):
    name = models.CharField(primary_key=True, max_length=20, blank=False, null=False, help_text="Feature Build name")
    start_time = models.DateTimeField(blank=False, null=False, verbose_name='Start', help_text="Start time of the feature build")
    end_time   = models.DateTimeField(blank=False, null=False, verbose_name='End', help_text="End time of the feature build")

    class Meta:
        ordering = ['-name']

    def __str__(self):
        return str(self.name)


class FailMessageType(models.Model):
    id              = models.BigAutoField(primary_key=True)
    author          = models.ForeignKey(User, on_delete=models.CASCADE)
    name            = models.TextField(max_length=300, blank=False, null=False, help_text="Shortened name of failure message")
    regex           = models.TextField(max_length=500, blank=False, null=False, help_text="Failure message regex")
    description     = models.TextField(max_length=500, blank=True, null=False, help_text="Description")
    env_issue_type  = models.ForeignKey(EnvIssueType, on_delete=models.CASCADE, blank=True, help_text="Environment issue type to set during analysis")

    class Meta:
        constraints = [models.UniqueConstraint(fields=["regex", "author"], name='regex_author_uniq')]

    def __str__(self):
        return str(self.regex)


class FailMessageTypeGroup(models.Model):
    id                 = models.BigAutoField(primary_key=True)
    author             = models.ForeignKey(User, on_delete=models.CASCADE)
    name               = models.TextField(max_length=300, blank=False, null=False, help_text="Name of failure message group")
    fail_message_types = models.ManyToManyField(FailMessageType)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["name", "author"], name='fmtg_name_author_uniq')]

    def __str__(self):
        return str(self.name)


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
    utecloud_run_id = models.CharField(max_length=250, unique=True)
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
    testline_type       = models.ForeignKey(TestlineType, on_delete=models.CASCADE, blank=False, null=True, help_text="Testline type")
    last_passing_logs   = models.ForeignKey(LastPassingLogs, default=None, on_delete=models.SET_NULL, blank=True, null=True, related_name="test_instances")
    organization        = models.ForeignKey(Organization, default=None, on_delete=models.SET_NULL, blank=True, null=True, related_name="test_instances")
    test_case_name      = models.CharField(max_length=200, blank=False, null=True, help_text="Testcase name")
    test_entity         = models.CharField(max_length=30, blank=True, null=True, help_text="Test Entity")
    execution_suspended = models.BooleanField(blank=True, default=False, null=True,  help_text="Execution suspended status")
    no_run_in_rp        = models.BooleanField(blank=True, default=False, null=True, help_text="No run status in ReportingPortal for the current Feature Build")

    class Meta:
        constraints = [models.UniqueConstraint(fields=["test_set", "test_case_name"], name='testinstance_uniq')]
        ordering = ['test_set', 'test_case_name',]

    def __str__(self):
        return f"{str(self.test_case_name)[:40]}... on {self.test_set.branch}"

    def has_last_passing_logs_set(self):
        return bool(self.last_passing_logs)

    def find_latest_passed_run_with_logs_available(self):
        for test_run in self.test_runs.all().exclude(log_file_url='').\
            exclude(log_file_url=None).filter(result=TestRunResult.objects.get_passed_instance()).order_by('-end_time'):
            if test_run.has_ute_logs_available():
                return test_run
        return None

    # def last_passing_logs_date_is_older_than(self, date):
    #     if self.has_last_passing_logs_set():
    #         return True if self.last_passing_logs.date < date else False
    #     else:
    #         return True


class TestRunManager(models.Manager):
    def exists_with_rp_id(self, rp_id):
        return self.filter(rp_id=rp_id).exists()

    def establish_testrun_test_entity_type(self, test_entity, param1, cit_cdrt_result, user_name, hyperlink_set):
        if user_name == "app_cloud_regression":
            if test_entity == "CRT":
                if param1 == "CDRT" and cit_cdrt_result == "CDRT":
                    return "CDRT"
                else:
                    return "CRT"
            elif test_entity == "CIT":
                if param1 == "CDRT":
                    return "CDRT" if "CDRT" in cit_cdrt_result else "CIT"
                else:
                    return "CIT"
            else:
                return cit_cdrt_result if cit_cdrt_result else "Other"
        else:
            if hyperlink_set:
                return "SingleRun"
            else:
                return "ManualRun"

    def create_from_rp_data_wo_related_fields(self, rp_test_run: Dict):
        def _strip_time(value: str):
            return datetime.strptime(value.split(".")[0], '%Y-%m-%dT%H:%M:%S')

        rp_id = rp_test_run["id"]
        comment = rp_test_run["comment"]
        pronto = ", ".join(rp_test_run["pronto"])
        start = utils.get_timezone_aware_datetime(_strip_time(rp_test_run["start"]))
        end = utils.get_timezone_aware_datetime(_strip_time(rp_test_run["end"]))
        _hyperlink_set = rp_test_run.get("hyperlink_set", "")
        if _hyperlink_set and len(_hyperlink_set) >= 2:
            log_file_url=_hyperlink_set[0].get("url", "")
            ute_exec_url=_hyperlink_set[1].get("url", "")
        else:
            ute_exec_url, log_file_url = "", ""
        _match = re.search(r"(.*)-\d+", rp_test_run.get('tc_execution_id') or "")
        execution_id = _match.group(1) if _match else None
        _test_entity = rp_test_run['qc_test_instance']["test_entity"]
        _param1 = rp_test_run['qc_test_instance']["param1"]
        _cit_cdrt_result = rp_test_run['cit_cdrt_result']
        _user_name = rp_test_run['user_name']
        exec_trigger = self.establish_testrun_test_entity_type(_test_entity, _param1, _cit_cdrt_result,
                                                                _user_name, _hyperlink_set)

        return self.model(
            # test_instance=test_instance,
            # testline_type=testline_type,
            # organization=organization,
            # result=result,
            # env_issue_type=env_issue_type,
            # analyzed_by=analyzed_by,
            # fb=fb,

            rp_id=rp_id,
            execution_id=execution_id,
            exec_trigger=exec_trigger,
            fail_message=rp_test_run["fail_message"],
            comment=comment,
            test_line=rp_test_run["test_line"],
            test_suite=rp_test_run["test_suite"],
            builds=rp_test_run["builds"],
            airphone=rp_test_run["airphone"],
            pronto=pronto,
            ute_exec_url=ute_exec_url,
            log_file_url=log_file_url,
            start_time=start,
            end_time=end,
        )


class TestRun(models.Model):
    objects          = TestRunManager()

    id               = models.BigAutoField(primary_key=True, help_text="Internal TRA TestRun id")
    rp_id            = models.BigIntegerField(unique=True, blank=False, null=True, help_text="Reporting Portal TestRun id")
    test_instance    = models.ForeignKey(TestInstance, on_delete=models.CASCADE, blank=False, help_text="Test instance", related_name="test_runs")
    testline_type    = models.ForeignKey(TestlineType, on_delete=models.CASCADE, blank=False, help_text="Testline configuration")
    organization     = models.ForeignKey(Organization, on_delete=models.CASCADE, blank=True, help_text="Organization")
    result           = models.ForeignKey(TestRunResult, on_delete=models.CASCADE, blank=False, help_text="Testrun result")
    env_issue_type   = models.ForeignKey(EnvIssueType, on_delete=models.CASCADE, blank=True, help_text="Env issue type")
    fb               = models.ForeignKey(FeatureBuild, on_delete=models.CASCADE, blank=True, help_text="Feature Build")

    execution_id     = models.CharField(max_length=100, blank=True, null=True, help_text="UTE Cloud execution id")
    exec_trigger     = models.CharField(max_length=30, blank=True, null=True, help_text="Execution trigger (test entity) CIT/CDRT/CRT")
    fail_message     = models.TextField(max_length=1000, blank=True, null=True, help_text="Fail message")
    comment          = models.TextField(max_length=1000, blank=True, null=True, help_text="Comment")
    test_line        = models.TextField(max_length=100, blank=True, null=True, help_text="Testline")
    test_suite       = models.TextField(max_length=200, blank=False, null=True, help_text="Testsuite name")
    builds           = models.TextField(max_length=100, blank=False, null=True, help_text="Builds")
    airphone         = models.TextField(max_length=100, blank=True, null=True, help_text="Airphone Build")
    pronto           = models.TextField(max_length=100, blank=True, null=True, help_text="Pronto")
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
        return f"{str(self.test_instance.test_case_name)[:40]} from {self.test_instance.test_set.branch}"

    def has_ute_logs_available(self):
        timezone = pytz.timezone(settings.TIME_ZONE)
        now =  timezone.localize(datetime.now())
        return self.ute_exec_url and ( now - self.end_time <= timedelta(days=config.UTE_LOGS_LIFESPAN))

    def is_older_than_x_fbs(self, exception: Exception=None, fb_retention: int=3):
        all_fbs = FeatureBuild.objects.all()
        if len(all_fbs) >= fb_retention:
            oldest_fb_start_time = all_fbs[fb_retention-1].start_time
            if oldest_fb_start_time > self.end_time:
                if exception is not None:
                    raise exception(f"RPID: {self.rp_id}; this test run with time={self.end_time} is older than last "
                                    f"{fb_retention} consecutive FeatureBuilds ({oldest_fb_start_time})")
                return True
        return False



class RepPortalUserToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name="rp_token")
    token = models.CharField(max_length=300, blank=False, null=True, help_text="RepPortal user specific token")

    def __str__(self):
        return str(self.user.username)


class TestSetFilter(models.Model):
    id                       = models.BigAutoField(primary_key=True)
    limit                    = models.IntegerField(blank=False, default=50,
                                                   help_text="Number of test runs pulled from Reporting Portal during every refresh")
    test_set_name            = models.TextField(max_length=300, blank=False, null=True, help_text="QC Test Set")
    test_lab_path            = models.TextField(max_length=300, blank=False, null=True, help_text="Test Lab Path")
    branch                   = models.ForeignKey(Branch, on_delete=models.CASCADE, blank=True, help_text="Branch, field set automatically")
    testline_types           = models.ManyToManyField(TestlineType, related_name="test_set_filters", blank=False,
                                                      help_text="Testline types used for tests in this TestSet")
    owners                   = models.ManyToManyField(User, related_name="owned_testsets", blank=True)
    subscribers              = models.ManyToManyField(User, related_name="subscribed_testsets", blank=True)
    fail_message_type_groups = models.ManyToManyField(FailMessageTypeGroup, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["test_set_name", "test_lab_path"], name='test_set_uniq_constr')]
        ordering = ['id']

    def __str__(self):
        part_of_lab_path = "\\".join(self.test_lab_path.split('\\')[2:])
        return f"{part_of_lab_path} - {str(self.test_set_name)[:30]}"

    def is_subscribed_by_anyone(self):
        subs_count = self.subscribers.all().count() # pylint: disable=no-member
        return False if subs_count == 0 else True

    def get_fail_message_types(self) -> List[FailMessageType]:
        fmtgs = self.fail_message_type_groups.all() # pylint: disable=no-member
        fmtg_fmt_list = [fmtg.fail_message_types.all() for fmtg in fmtgs]
        fmts = list(chain(*fmtg_fmt_list))
        return fmts

    def get_filters_for_rp_api(self, testrun_result: str):
        return {
            "result": testrun_result,
            "testline_type": ",".join([tl_type.name for tl_type in self.testline_types.all()]), # pylint: disable=no-member
            "test_set": self.test_set_name,
            "test_lab_path": self.test_lab_path
        }

    def try_to_get_rp_api_token_from_testset_filter_owners(self):
        token = None
        for user in self.owners.all(): # pylint: disable=no-member
            if hasattr(user, 'rp_token') and user.rp_token.token:
                token = user.rp_token.token
        return token

    def save(self, *args, **kwargs):
        match = re.search(r'Root\\+Test_Sets\\+(\w+)\\+', self.test_lab_path)
        if match:
            branch = match.group(1)
        else:
            raise ValidationError(
                "The branch could not have been parsed correctly from specified TestLabPath. "
                "Make sure that the TestLabPath is written correctly.")
        branch_instance, _ = Branch.objects.all().get_or_create(name=branch)
        self.branch = branch_instance
        self.test_lab_path = self.test_lab_path.replace('\\\\', '\\')
        super(TestSetFilter, self).save(*args, **kwargs)