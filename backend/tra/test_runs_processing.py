import os
import re
from datetime import datetime
from typing import Dict, List, Tuple

from constance import config
from django.db import IntegrityError
from rep_portal.api import RepPortal

from . import tasks as celery_tasks
from . import utils
from .models import (
    EnvIssueType, FailMessageType,
    FeatureBuild, LastPassingLogs, Organization, TestInstance,
    TestlineType, TestRun, TestRunResult, TestSetFilter
)
from .storage import get_loghtml_storage_instance


class TestRunProcException(Exception):
    pass


class TestRunUpdated(TestRunProcException):
    pass


class TestRunWithSuchRpIdAlreadyExists(TestRunProcException):
    pass


class TestRunFbOlderThan3ConsecFbs(TestRunProcException):
    pass


class TestRunResultNotSupported(TestRunProcException):
    pass


class TestRunProcessing:
    def __init__(self, rp_tr_data) -> None:
        self.rp_tr_data = rp_tr_data
        self.rp_id = rp_tr_data["id"]
        self.test_entity = rp_tr_data['qc_test_instance']["test_entity"]
        self.test_run = None

    def _testrun_exists_in_db(self) -> bool:
        return TestRun.objects.exists_with_rp_id(self.rp_id)

    def _check_testrun_not_too_old(self):
        self.test_run.is_older_than_x_fbs(
            exception=TestRunFbOlderThan3ConsecFbs,
            fb_retention=config.FB_TESTRUN_PULL_SYNC_RETENTION
        )

    def _get_major_fields_dict(self) -> dict:
        self._assign_result()
        self._assign_env_issue_type()
        major_fields =  {
            "result": self.test_run.result,
            "env_issue_type": self.test_run.env_issue_type,
            "comment": self.test_run.comment,
            "pronto": self.test_run.pronto,
            "execution_id": self.test_run.execution_id,
            "exec_trigger": self.test_run.exec_trigger,
            "test_entity": self.test_entity
        }
        return major_fields

    def perform_update_of_existing_test_run(self):
        def _has_any_major_fields_changed(
                trdb: TestRun, result: TestRunResult, env_issue_type: EnvIssueType,
                comment: str, pronto: str, execution_id: str, exec_trigger: str, test_entity: str
        ):
            if (trdb.result != result or
                trdb.env_issue_type != env_issue_type or
                trdb.comment != comment or
                trdb.pronto != pronto or
                trdb.execution_id != execution_id or
                trdb.exec_trigger != exec_trigger or
                (trdb.test_instance.test_entity != test_entity and test_entity)
                ):
                return True
            return False

        testrun_db = TestRun.objects.get(rp_id=self.rp_id)
        major_fields =  self._get_major_fields_dict()
        if _has_any_major_fields_changed(trdb=testrun_db, **major_fields):
            for attribute, value in major_fields.items():
                # handle update of test_entity in test_instance if new testrun indicates
                # that test_entity changed
                if attribute == "test_entity" and value:
                    if not getattr(testrun_db.test_instance, attribute):
                        setattr(testrun_db.test_instance, attribute, value)
                        testrun_db.test_instance.save()
                    continue
                # update of every major field
                if getattr(testrun_db, attribute) != value:
                    if attribute == "result":
                        if getattr(testrun_db, attribute) == TestRunResult.objects.get_not_analyzed_instance():
                            # handle case when not_analyzed tr is analyzed as env issue
                            if value == TestRunResult.objects.get_env_issue_instance():
                                setattr(testrun_db, "analyzed_by", utils.get_external_analyzer_user())
                            if value == TestRunResult.objects.get_blocked_instance():
                                pass
                    setattr(testrun_db, attribute, value)
            testrun_db.save()
            raise TestRunUpdated(self.rp_id)
        raise TestRunWithSuchRpIdAlreadyExists(self.rp_id)

    def _check_testrun_not_exists_in_db(self):
        if self._testrun_exists_in_db():
            self.perform_update_of_existing_test_run()

    def perform_checks(self):
        self._check_testrun_not_too_old()
        self._check_testrun_not_exists_in_db()

    def _assign_result(self):
        rp_result = self.rp_tr_data["result"]
        if rp_result not in TestRunResult.objects.get_list_of_all_supported_result_names():
            raise TestRunResultNotSupported(rp_result)
        result, _ = TestRunResult.objects.get_or_create(name=rp_result)
        self.test_run.result = result

    def _assign_env_issue_type(self):
        env_issue_type, _ = EnvIssueType.objects.get_or_create(
            name=utils.return_empty_if_none(self.rp_tr_data["env_issue_type"])
        )
        self.test_run.env_issue_type = env_issue_type

    def _assign_analyzed_by(self):
        analyzed_by = None
        if self.test_run.result == TestRunResult.objects.get_env_issue_instance():
            analyzed_by = utils.get_external_analyzer_user()
        self.test_run.analyzed_by = analyzed_by

    def _assign_testline_type(self):
        testline_type, _ = TestlineType.objects.get_or_create(
            name=utils.return_empty_if_none(self.rp_tr_data['test_col']["testline_type"])
        )
        self.test_run.testline_type = testline_type

    def _assign_organization(self):
        organization, _ = Organization.objects.get_or_create(
            name=utils.return_empty_if_none(self.rp_tr_data["qc_test_instance"]["organization"])
        )
        self.test_run.organization = organization

    def _assign_fb(self):
        fb_name, fb_start, fb_end = utils.get_fb_info_based_on_date(self.test_run.end_time)
        fb, _ = FeatureBuild.objects.get_or_create(name=fb_name, start_time=fb_start, end_time=fb_end)
        self.test_run.fb = fb

    def _assign_test_instance(self):
        test_set_filter = TestSetFilter.objects.get(
            test_set_name=self.rp_tr_data["qc_test_set"],
            test_lab_path=self.rp_tr_data["qc_test_instance"].get("m_path", ""),
            testline_types=self.rp_tr_data['test_col']["testline_type"]
        )

        ti_id = self.rp_tr_data["qc_test_instance"]["id"]
        ti_test_entity = self.test_entity
        test_case_name = self.rp_tr_data["test_case"]["name"]

        if TestInstance.objects.filter(rp_id=ti_id).exists():
            test_instance = TestInstance.objects.get(rp_id=ti_id)
            if test_instance.test_set != test_set_filter:
                test_instance.test_set = test_set_filter
            if test_instance.test_case_name != test_case_name:
                test_instance.test_case_name = test_case_name
            if test_instance.testline_type != self.test_run.testline_type:
                test_instance.testline_type = self.test_run.testline_type
            if ti_test_entity and test_instance.test_entity != ti_test_entity:
                test_instance.test_entity = ti_test_entity
            test_instance.save()
        else:
            test_instance = TestInstance.objects.create(
                rp_id=ti_id,
                test_set=test_set_filter,
                test_case_name=test_case_name,
                organization=self.test_run.organization,
                testline_type=self.test_run.testline_type
            )
        self.test_run.test_instance = test_instance

    def assign_related_fields(self):
        self._assign_result()
        self._assign_env_issue_type()
        self._assign_analyzed_by()
        self._assign_testline_type()
        self._assign_organization()
        self._assign_fb()
        self._assign_test_instance()

    def process(self):
        self.test_run = TestRun.objects.create_from_rp_data_wo_related_fields(self.rp_tr_data)
        self.perform_checks()
        self.assign_related_fields()
        self.test_run.save()


def match_fail_message_type(
    fail_message: str, fail_message_types: List[FailMessageType]
) -> Tuple[FailMessageType, int]:
    lines = fail_message.split('\n')
    for no, line in enumerate(lines):
        for fmt in fail_message_types:
            if re.search(fmt.regex, line):
                return fmt, no
    return None, None


def send_testrun_analysis_to_rp(test_run, auth_params):
    celery_tasks.celery_analyze_testruns.delay(
        runs=[test_run.rp_id],
        comment=f"Analyzed by user {test_run.analyzed_by.username}: {test_run.comment}",
        common_build=test_run.builds,
        result=test_run.result.name,
        env_issue_type=test_run.env_issue_type.name,
        auth_params=auth_params
    )


def try_to_analyze_test_run(
    test_run: TestRun, fail_message_types: List[FailMessageType],
    first_lines_to_match: int=3, auth_params: dict=None
):
    fail_message_type, line_no = match_fail_message_type(
        fail_message=test_run.fail_message,
        fail_message_types=fail_message_types
    )
    if fail_message_type and line_no <= first_lines_to_match:
        test_run.result = TestRunResult.objects.get_env_issue_instance()
        test_run.env_issue_type = fail_message_type.env_issue_type
        test_run.comment = fail_message_type.name
        test_run.analyzed = True
        test_run.analyzed_by = utils.get_autoanalyzer_user()
        send_testrun_analysis_to_rp(test_run, auth_params)
    return test_run


def create_testrun_obj_based_on_rp_data(rp_test_run: Dict, ignore_old_testruns: bool=True):
    def return_empty_if_none(elem):
        return elem if elem is not None else ""

    def _strip_time(value: str):
        return datetime.strptime(value.split(".")[0], '%Y-%m-%dT%H:%M:%S')

    def _has_any_major_fields_changed(trdb: TestRun, result: TestRunResult, env_issue_type: EnvIssueType,
                                      comment: str, execution_id: str, exec_trigger: str, test_entity: str):
        if (trdb.result != result or
            trdb.env_issue_type != env_issue_type or
            trdb.comment != comment or
            trdb.execution_id != execution_id or
            trdb.exec_trigger != exec_trigger or
            (trdb.test_instance.test_entity != test_entity and test_entity)
            ):
            return True
        return False

    def _check_for_testrun_existence_and_update_if_present():
        this_testrun_in_db = TestRun.objects.filter(rp_id=rp_id)
        _major_fields =  {
            "result": result,
            "env_issue_type": env_issue_type,
            "comment": comment,
            "execution_id": execution_id,
            "exec_trigger": exec_trigger,
            "test_entity": test_entity
        }
        if this_testrun_in_db.exists():
            testrun_db = this_testrun_in_db.first()
            if _has_any_major_fields_changed(trdb=testrun_db, **_major_fields):
                for attribute, value in _major_fields.items():
                    # handle update of test_entity in test_instance if new testrun indicates
                    # that test_entity changed
                    if attribute == "test_entity" and value:
                        if not getattr(testrun_db.test_instance, attribute):
                            setattr(testrun_db.test_instance, attribute, value)
                            testrun_db.test_instance.save()
                        continue
                    # update of every major field
                    if getattr(testrun_db, attribute) != value:
                        if getattr(testrun_db, attribute) == TestRunResult.objects.get_not_analyzed_instance():
                            # handle case when not_analyzed tr is analyzed as env issue
                            if value == TestRunResult.objects.get_env_issue_instance():
                                setattr(testrun_db, "analyzed_by", utils.get_external_analyzer_user())
                            if value == TestRunResult.objects.get_failed_instance():
                                setattr(testrun_db, "pronto", pronto)
                            if value == TestRunResult.objects.get_blocked_instance():
                                pass
                        setattr(testrun_db, attribute, value)
                testrun_db.save()
                raise TestRunUpdated(rp_id)
            raise TestRunWithSuchRpIdAlreadyExists(rp_id)

    def _handle_test_instance_update_or_creation():
        if TestInstance.objects.filter(rp_id=rp_test_run["qc_test_instance"]["id"]).exists():
            test_instance = TestInstance.objects.get(rp_id=rp_test_run["qc_test_instance"]["id"])
            if test_instance.test_set != test_set_filter:
                test_instance.test_set = test_set_filter
            if test_instance.test_case_name != rp_test_run["test_case"]["name"]:
                test_instance.test_case_name = rp_test_run["test_case"]["name"]
            if test_instance.testline_type != testline_type:
                test_instance.testline_type = testline_type
            if test_entity and test_instance.test_entity != test_entity:
                test_instance.test_entity = test_entity
            test_instance.save()
        else:
            test_instance = TestInstance.objects.create(
                rp_id=rp_test_run["qc_test_instance"]["id"],
                test_set=test_set_filter,
                test_case_name=rp_test_run["test_case"]["name"],
                organization=organization,
                testline_type=testline_type
            )
        return test_instance

    rp_id = rp_test_run["id"]
    comment = rp_test_run["comment"]
    pronto = ", ".join(rp_test_run["pronto"])
    start = utils.get_timezone_aware_datetime(_strip_time(rp_test_run["start"]))
    end = utils.get_timezone_aware_datetime(_strip_time(rp_test_run["end"]))
    fb_name, fb_start, fb_end = utils.get_fb_info_based_on_date(end)
    if ignore_old_testruns:
        # utils.check_if_testrun_is_older_than_3_fbs(rp_id, end, exception=TestRunFBOlderThan3ConsecFBs)
        pass

    env_issue_type, _ = EnvIssueType.objects.get_or_create(
        name=return_empty_if_none(rp_test_run["env_issue_type"])
    )
    result, _ = TestRunResult.objects.get_or_create(name=rp_test_run["result"])
    analyzed_by = utils.get_external_analyzer_user() if result == TestRunResult.objects.get_env_issue_instance() else None

    hyperlink_set = rp_test_run.get("hyperlink_set", "")
    if hyperlink_set and len(hyperlink_set) >= 2:
        log_file_url=hyperlink_set[0].get("url", "")
        ute_exec_url=hyperlink_set[1].get("url", "")
    else:
        ute_exec_url, log_file_url = "", ""

    _match = re.search(r"(.*)-\d+", rp_test_run.get('tc_execution_id') or "")
    execution_id = _match.group(1) if _match else None
    test_entity = rp_test_run['qc_test_instance']["test_entity"]
    param1 = rp_test_run['qc_test_instance']["param1"]
    cit_cdrt_result = rp_test_run['cit_cdrt_result']
    user_name = rp_test_run['user_name']
    exec_trigger = TestRun.objects.establish_testrun_test_entity_type(test_entity, param1, cit_cdrt_result,
                                                            user_name, hyperlink_set)
    _check_for_testrun_existence_and_update_if_present()

    fb, _ = FeatureBuild.objects.get_or_create(name=fb_name, start_time=fb_start, end_time=fb_end)

    test_set_filter = TestSetFilter.objects.get(
        test_set_name=rp_test_run["qc_test_set"],
        test_lab_path=rp_test_run["qc_test_instance"].get("m_path", ""),
        testline_types=rp_test_run['test_col']["testline_type"]
    )
    organization, _ = Organization.objects.get_or_create(
        name=return_empty_if_none(rp_test_run["qc_test_instance"]["organization"])
    )
    testline_type, _ = TestlineType.objects.get_or_create(
        name=return_empty_if_none(rp_test_run['test_col']["testline_type"])
    )

    test_instance = _handle_test_instance_update_or_creation()

    test_run = TestRun(
        rp_id=rp_id,
        fb=fb,
        test_instance=test_instance,
        testline_type=testline_type,
        organization=organization,
        result=result,
        env_issue_type=env_issue_type,
        comment=comment,
        pronto=pronto,
        fail_message=rp_test_run["fail_message"],
        test_line=rp_test_run["test_line"],
        test_suite=rp_test_run["test_suite"],
        builds=rp_test_run["builds"],
        airphone=rp_test_run["airphone"],
        ute_exec_url=ute_exec_url,
        log_file_url=log_file_url,
        # log_file_url_ext
        start_time=start,
        end_time=end,
        exec_trigger=exec_trigger,
        execution_id=execution_id,
        analyzed_by=analyzed_by,
    )
    return test_run


def pull_notanalyzed_and_envissue_testruns_by_testset_filter(
    testset_filter_id: int, try_to_analyze: bool=True, query_limit: int=None
):
    def _create_testrun_and_handle_its_actions_based_on_its_result(test_run):
        rp_id_raw = test_run["id"] if "id" in test_run.keys() else None
        try:
            tr = create_testrun_obj_based_on_rp_data(test_run, ignore_old_testruns=True)
            not_analyzed = TestRunResult.objects.get_not_analyzed_instance()
            if try_to_analyze and testset_filter and (tr.result == not_analyzed):
                tr = try_to_analyze_test_run(
                    test_run=tr, fail_message_types=fail_message_types, auth_params=auth_params
                )

            tr.save()
            new_runs.append(tr.rp_id)

        except TestRunWithSuchRpIdAlreadyExists as e:
            skipped_runs.append(rp_id_raw)
            utils.log_exception_info(exception=e, rp_id=rp_id_raw)

        except TestRunUpdated as e:
            updated.append(rp_id_raw)
            utils.log_exception_info(exception=e, rp_id=rp_id_raw)

        except TestRunFbOlderThan3ConsecFbs as e:
            utils.log_exception_info(exception=e, rp_id=rp_id_raw)

        except IntegrityError as e:
            errored.append(dict(rp_id=rp_id_raw, error=type(e).__name__))
            utils.log_exception_info(exception=e, rp_id=rp_id_raw)


    testset_filter = TestSetFilter.objects.get(id=testset_filter_id)
    filters = testset_filter.get_filters_for_rp_api(testrun_result="not analyzed,environment issue,failed,blocked")
    if not query_limit:
        query_limit = testset_filter.limit

    new_runs, skipped_runs, updated, errored = [], [], [], []

    if try_to_analyze and testset_filter:
        fail_message_types = testset_filter.get_fail_message_types()

    auth_params = utils.get_rp_api_auth_params(testset_filter)
    test_runs_data, _ = RepPortal(**auth_params).get_data_from_testruns(limit=query_limit, filters=filters)
    for test_run in test_runs_data:
        _create_testrun_and_handle_its_actions_based_on_its_result(test_run)
    return {'new_runs': new_runs, 'skipped_runs': skipped_runs, "updated": updated, "errored": errored}


def pull_passed_testruns_by_testset_filter(testset_filter_id: int, query_limit: int=None):
    def _create_testrun_and_handle_its_actions_based_on_its_result(test_run):
        rp_id_raw = test_run["id"] if "id" in test_run.keys() else None
        try:
            tr = create_testrun_obj_based_on_rp_data(test_run, ignore_old_testruns=True)
            # if tr.has_ute_logs_available():
            tr.save()
            new_runs.append(tr.rp_id)
            # else:
            #     skipped_runs.append(tr.rp_id)

        except TestRunWithSuchRpIdAlreadyExists as e:
            skipped_runs.append(rp_id_raw)
            utils.log_exception_info(exception=e, rp_id=rp_id_raw)

        except TestRunUpdated as e:
            updated.append(rp_id_raw)
            utils.log_exception_info(exception=e, rp_id=rp_id_raw)

        except TestRunFbOlderThan3ConsecFbs as e:
            utils.log_exception_info(exception=e, rp_id=rp_id_raw)

        except IntegrityError as e:
            errored.append(dict(rp_id=rp_id_raw, error=type(e).__name__))
            utils.log_exception_info(exception=e, rp_id=rp_id_raw)



    testset_filter = TestSetFilter.objects.get(id=testset_filter_id)
    filters = testset_filter.get_filters_for_rp_api(testrun_result="passed")
    if not query_limit:
        query_limit = testset_filter.limit

    new_runs, skipped_runs, updated, errored = [], [], [], []

    auth_params = utils.get_rp_api_auth_params(testset_filter)
    test_runs_data, _ = RepPortal(**auth_params).get_data_from_testruns(limit=query_limit, filters=filters)
    for test_run in test_runs_data:
        _create_testrun_and_handle_its_actions_based_on_its_result(test_run)
    return {'new_runs': new_runs, 'skipped_runs': skipped_runs, "updated": updated, "errored": errored}


def download_latest_passed_logs_to_storage():
    def find_latest_passed_run_and_prepare_last_passing_logs_data(test_instance):
        latest_passed_test_run = test_instance.find_latest_passed_run_with_logs_available()
        if not latest_passed_test_run:
            log_inst_info_dict.setdefault(None, {
            "utecloud_run_id": "Could not find latest passed run with log_file_url filled",
            "ute_exec_url_exact": None,
            "test_instance_ids": []
            })
            log_inst_info_dict[None]["test_instance_ids"].append(test_instance.id)
            return

        ute_cloud_sr_id = utils.get_testrun_ute_cloud_sr_execution_id(latest_passed_test_run.ute_exec_url)

        if test_instance.has_last_passing_logs_set():
            if test_instance.last_passing_logs.utecloud_run_id == ute_cloud_sr_id:
                return

        logs_instance, created = LastPassingLogs.objects.get_or_create(
            utecloud_run_id=ute_cloud_sr_id,
            build=latest_passed_test_run.builds,
            airphone=latest_passed_test_run.airphone
        )

        if not created and logs_instance.downloaded is True:
            test_instance.last_passing_logs = logs_instance
            test_instance.save()
            return

        log_file_url = latest_passed_test_run.log_file_url
        logs_url = log_file_url.split('test_results')[0]
        log_inst_info_dict.setdefault(logs_instance.id, {
            "utecloud_run_id": ute_cloud_sr_id,
            "ute_exec_url_exact": logs_url,
            "test_instance_ids": []
            }
        )
        log_inst_info_dict[logs_instance.id]["test_instance_ids"].append(test_instance.id)


    def schedule_download_of_logs(log_inst_info_dict):
        tasks = {}
        for logs_instance_id, info in log_inst_info_dict.items():
            if logs_instance_id is None:
                continue
            utecloud_run_id = info["utecloud_run_id"]
            task = celery_tasks.celery_download_resursively_contents_to_storage.delay(
                lpl_id=logs_instance_id,
                test_instance_ids=info["test_instance_ids"],
                directory=utecloud_run_id,
                url=info["ute_exec_url_exact"]
            )
            tasks[logs_instance_id] = task.id
        return tasks

    log_inst_info_dict = {}
    testset_filters = TestSetFilter.objects.all()
    for testset_filter in testset_filters:
        if testset_filter.is_subscribed_by_anyone():
            test_instances = testset_filter.test_instances.all()
            for test_instance in test_instances:
                find_latest_passed_run_and_prepare_last_passing_logs_data(test_instance)


    async_tasks = schedule_download_of_logs(log_inst_info_dict)
    return {"celery_tasks": async_tasks, "log_inst_info_dict": log_inst_info_dict}


def download_testrun_logs_to_mirror_storage():
    def get_all_testruns_with_logs_available(test_instance):
        trs_with_logs = []
        for test_run in test_instance.test_runs.all().exclude(ute_exec_url='').\
            exclude(ute_exec_url=None).order_by('-end_time'):
            if test_run.has_ute_logs_available():
                trs_with_logs.append(test_run.id)
        return trs_with_logs

    eligible_trs = []
    for testset_filter in TestSetFilter.objects.all():
        if testset_filter.is_subscribed_by_anyone():
            test_instances = testset_filter.test_instances.all()
            for test_instance in test_instances:
                eligible_trs_per_ti = get_all_testruns_with_logs_available(test_instance)
                if eligible_trs_per_ti:
                    eligible_trs.extend(eligible_trs_per_ti)

    trs_queryset = TestRun.objects.filter(id__in=eligible_trs).order_by('ute_exec_url').\
        values('ute_exec_url', 'execution_id').distinct()
    tasks = []
    storage = get_loghtml_storage_instance()
    if not storage.exists(''):
        os.makedirs(storage.path(''), exist_ok=True)

    dirs, _ = storage.listdir('')
    for testrun in trs_queryset:
        exec_id = testrun['execution_id'] if testrun['execution_id'] else \
            utils.get_testrun_ute_cloud_sr_execution_id(testrun['ute_exec_url'])
        if exec_id not in dirs:
            task = celery_tasks.celery_download_logs_to_mirror_storage.delay(
                directory=exec_id,
                url=testrun['ute_exec_url']
            )
            tasks.append(task.id)

    return {"celery_tasks": tasks}


def sync_suspension_status_of_test_instances_by_testset_filter(testset_filter_id: int, limit=None):
    def get_ti_suspended_status_from_results(ti_id: int):
        return next((item["suspended"] for item in results if item["id"] == ti_id), None)

    not_found = []
    testset_filter = TestSetFilter.objects.get(id=testset_filter_id)
    # postfix = testset_filter.test_lab_path.split('\\')[-1]
    if not limit:
        limit = testset_filter.limit

    auth_params = utils.get_rp_api_auth_params(testset_filter)
    results, _ = RepPortal(**auth_params).get_data_from_testinstances(
        limit=limit, test_lab_path=testset_filter.test_lab_path
    )
    for test_instance in testset_filter.test_instances.all():
        suspended_status = get_ti_suspended_status_from_results(test_instance.rp_id)
        if suspended_status is None:
            not_found.append(test_instance.rp_id)
        test_instance.execution_suspended = suspended_status
        test_instance.save()
    return {"not_updated": not_found}


def sync_suspension_status_of_test_instances_by_ids(ti_ids: List[int], auth_params=None):
    def get_ti_suspended_status_from_results(ti_id: int):
        return next((item["suspended"] for item in results if item["id"] == ti_id), None)

    not_found, updated = [], []
    if auth_params is None:
        auth_params = utils.get_rp_api_auth_params()
    results, _ = RepPortal(**auth_params).get_data_from_testinstances(ids=ti_ids)
    for test_instance in TestInstance.objects.filter(rp_id__in=ti_ids):
        suspended_status = get_ti_suspended_status_from_results(test_instance.rp_id)
        if suspended_status is None:
            not_found.append(test_instance.rp_id)
        else:
            updated.append(test_instance.rp_id)
        test_instance.execution_suspended = suspended_status
        test_instance.save()
    return {"not_found": not_found, "updated": updated}



######################################################################
###########            FOR DEV PURPOSES USES ONLY          ###########
######################################################################

def pull_notanalyzed_and_envissue_testruns_by_all_testset_filters(query_limit: int=None):
    testset_filters = TestSetFilter.objects.all()
    tr_by_rf = {testset_filter.id: [] for testset_filter in testset_filters}
    tr_by_rf_skipped = {testset_filter.id: [] for testset_filter in testset_filters}
    for testset_filter in testset_filters:
        pull_stats = pull_notanalyzed_and_envissue_testruns_by_testset_filter(testset_filter_id=testset_filter.id, query_limit=query_limit)
        tr_by_rf[testset_filter.id] = pull_stats["loaded_new_runs"]
        tr_by_rf_skipped[testset_filter.id] = pull_stats["skipped_runs"]
    return {'loaded_new_runs': tr_by_rf, 'skipped_runs': tr_by_rf_skipped}


def fill_empty_test_instances_with_their_rp_ids():
    def get_ti_id_from_results(tc_name, test_set_name, test_lab_path):
        for elem in results:
            if elem["name"].startswith('[1]') or elem["name"].startswith('[1.0]'):
                name = elem["name"].split(']')[-1].strip()
            else:
                name = elem["name"]
            if elem["test_set"]["name"] == test_set_name and name == tc_name and elem["m_path"] == test_lab_path:
                return elem["id"]
        return None

    not_found = []
    for testset_filter in TestSetFilter.objects.all():
        auth_params = utils.get_rp_api_auth_params(testset_filter)
        results, _ = RepPortal(**auth_params).get_data_from_testinstances(limit=1000, test_lab_path=testset_filter.test_lab_path)
        for test_instance in testset_filter.test_instances.all():
            rp_id = get_ti_id_from_results(test_instance.test_case_name, testset_filter.test_set_name,  testset_filter.test_lab_path)
            if rp_id is None:
                not_found.append(test_instance)
            else:
                test_instance.rp_id = rp_id
                test_instance.save()

    return [str(e) for e in not_found]
