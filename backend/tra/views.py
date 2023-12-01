import copy
from functools import reduce
from celery.result import AsyncResult
from django.contrib.auth.models import User
from django.db.models import Count, Q, Case, When, Value
from django.db import IntegrityError
from django.views.generic import ListView
from drf_yasg.utils import no_body, swagger_auto_schema
from rest_framework import (authentication, generics, mixins, permissions,
                            serializers, status, views, viewsets)
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from backend.openapi_schemes import *
from backend.permissions import IsAuthorOfObject, IsUserOfObject

from . import tasks as celery_tasks
from . import test_runs_processing, utils
from .filters import TestInstanceFilter, TestRunFilter
from .models import (Branch, EnvIssueType, FailMessageType,
                     FailMessageTypeGroup, FeatureBuild, LastPassingLogs,
                     Notification, Organization, TestInstance, TestlineType,
                     TestRun, TestRunResult, TestSetFilter)
from .pagination import StandardResultsSetPagination
from .permissions import IsOwnerOfObject, IsSubscribedToObject
from .serializers import (
    BranchSerializer, EnvIssueTypeSerializer,
    FailMessageTypeGroupSerializer,
    FailMessageTypeSerializer, FeatureBuildSerializer,
    LastPassingLogsSerializer, NotificationSerializer,
    TestInstanceSerializer, TestlineTypeSerializer,
    TestRunResultSerializer, TestRunSerializer,
    TestSetFilterSerializer, UserSerializer,
    get_distinct_values_based_on_subscribed_testsetfilters,
    get_distinct_values_based_on_test_instance
)


class FailMessageTypeView(viewsets.ModelViewSet):
    serializer_class = FailMessageTypeSerializer
    queryset = FailMessageType.objects.all()
    pagination_class = None
    permission_classes = (IsAuthenticated,)

    @action(detail=False, url_path="my")
    def my(self, request):
        fmts = FailMessageType.objects.filter(author=request.user)
        serializer = self.get_serializer(fmts, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        try:
            serializer.save(author=self.request.user)
        except IntegrityError as e:
            if 'unique constraint "regex_author_uniq"' in e.args[0]:
                raise ValidationError("This user already has FailMessageType with such regex.")

    def get_permissions(self):
        permissions = [permission() for permission in self.permission_classes]
        if self.request.method in ['PUT', 'DELETE']:
            return permissions + [IsAuthorOfObject()]
        return permissions


class FailMessageTypeGroupView(viewsets.ModelViewSet):
    serializer_class = FailMessageTypeGroupSerializer
    queryset = FailMessageTypeGroup.objects.all()
    pagination_class = None

    @action(detail=False, url_path="my")
    def my(self, request):
        tsfilters = FailMessageTypeGroup.objects.filter(author=request.user)
        serializer = self.get_serializer(tsfilters, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        try:
            serializer.save(author=self.request.user)
        except IntegrityError as e:
            if 'unique constraint "fmtg_name_author_uniq"' in e.args[0]:
                raise ValidationError("This user already has FailMessageTypeGroup with such name.")

    def get_permissions(self):
        permissions = [permission() for permission in self.permission_classes]
        if self.request.method in ['PUT', 'DELETE']:
            return permissions + [IsAuthorOfObject()]
        return permissions



class NotificationView(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    pagination_class = None

    def get_permissions(self):
        permissions = [permission() for permission in self.permission_classes]
        return permissions + [IsUserOfObject()]

    def get_queryset(self):
        if self.request.user.is_anonymous:
            return Notification.objects.none()
        else:
            return Notification.objects.filter(user=self.request.user)


class TestlineTypeView(viewsets.ReadOnlyModelViewSet):
    serializer_class = TestlineTypeSerializer
    queryset = TestlineType.objects.all()
    pagination_class = None


class BranchView(viewsets.ReadOnlyModelViewSet):
    serializer_class = BranchSerializer
    queryset = Branch.objects.all()
    pagination_class = None


class TestRunResultView(viewsets.ReadOnlyModelViewSet):
    serializer_class = TestRunResultSerializer
    queryset = TestRunResult.objects.all()
    pagination_class = None


class EnvIssueTypeView(viewsets.ReadOnlyModelViewSet):
    serializer_class = EnvIssueTypeSerializer
    queryset = EnvIssueType.objects.all()
    pagination_class = None


class LastPassingLogsView(viewsets.ReadOnlyModelViewSet):
    serializer_class = LastPassingLogsSerializer
    queryset = LastPassingLogs.objects.all()
    pagination_class = None


class TestInstanceView(viewsets.ReadOnlyModelViewSet):
    serializer_class = TestInstanceSerializer
    queryset = TestInstance.objects.all()


class TestSetFilterView(viewsets.ModelViewSet):
    serializer_class = TestSetFilterSerializer
    queryset = TestSetFilter.objects.all()
    pagination_class = None


    def _serialize_and_paginate_response(self, tsfilters, status=status.HTTP_200_OK):
        page = self.paginate_queryset(tsfilters)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(tsfilters, many=True)
        return Response(serializer.data, status=status)


    def _serialize_response(self, tsfilters, status=status.HTTP_200_OK):
        serializer = self.get_serializer(tsfilters, many=True)
        return Response(serializer.data, status=status)


    @action(detail=False, url_path="owned")
    def user_is_owner(self, request):
        tsfilters = TestSetFilter.objects.filter(owners=request.user)
        return self._serialize_response(tsfilters)


    @action(detail=False, url_path="subscribed")
    def user_is_subscribed(self, request):
        tsfilters = TestSetFilter.objects.filter(subscribers=request.user)
        return self._serialize_response(tsfilters)


    @action(detail=False, url_path="branched", methods=['get'])
    def users_branch_only(self, request):
        branch = self.request.query_params.get('branch', None)
        tsfilters = TestSetFilter.objects.filter(owners=request.user)
        if branch:
            tsfilters = tsfilters.filter(branch__name=branch)
        return self._serialize_response(tsfilters)


    @swagger_auto_schema(
        description="Method to batch subscribe to TestSetFilters",
        operation_description="Method to batch subscribe to TestSetFilters",
        request_body=testsetfilter_id_schema,
        responses={200: testsetfilter_id_schema},
        tags=["api", "TestSetFilter: Batch"]
    )
    @action(detail=False, url_path="subscribe", methods=['post'])
    def batch_subscribe(self, request):
        pks = [tsdata['id'] for tsdata in request.data]
        tsfilters = TestSetFilter.objects.filter(pk__in=pks)

        for tsfilter in tsfilters:
            if self.request.user not in tsfilter.subscribers.all():
                tsfilter.subscribers.add(self.request.user)
                tsfilter.save()

        return self._serialize_response(tsfilters)

    @swagger_auto_schema(
        description="Method to batch unsubscribe to TestSetFilters",
        operation_description="Method to batch unsubscribe to TestSetFilters",
        request_body=testsetfilter_id_schema,
        responses={200: testsetfilter_id_schema},
        tags=["api", "TestSetFilter: Batch"]
    )
    @action(detail=False, url_path="unsubscribe", methods=['post'])
    def batch_unsubscribe(self, request):
        pks = [tsdata['id'] for tsdata in request.data]
        tsfilters = TestSetFilter.objects.filter(pk__in=pks)

        for tsfilter in tsfilters:
            if self.request.user in tsfilter.subscribers.all():
                tsfilter.subscribers.remove(self.request.user)
                tsfilter.save()

        return self._serialize_response(tsfilters)


    @swagger_auto_schema(
        description="Method to batch delete TestSetFilters",
        operation_description="Method to batch delete TestSetFilters",
        request_body=testsetfilter_id_schema,
        responses={204: ""},
        tags=["api", "TestSetFilter: Batch"]
    )
    @action(detail=False, url_path="delete", methods=['delete'])
    def batch_delete(self, request):
        pks = [tsdata['id'] for tsdata in request.data]
        tsfilters = TestSetFilter.objects.filter(pk__in=pks)

        for tsfilter in tsfilters:
            self.check_object_permissions(self.request, tsfilter)

        tsfilters.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


    @swagger_auto_schema(
        description="Method to batch branchoff specified TestSetFilters",
        operation_description="Method to batch branchoff specified TestSetFilters",
        request_body=testsetfilter_branchoff_schema,
        responses={204: ""},
        tags=["api", "TestSetFilter: Batch"]
    )
    @action(detail=False, url_path="branchoff", methods=['post'])
    def batch_branchoff(self, request):
        pks = [tsdata['id'] for tsdata in request.data["testsetfilters"]]
        should_delete = request.data.get("delete", False)
        should_unsubscribe = request.data.get("unsubscribe", False)
        should_unsubscribe_all = request.data.get("unsubscribe_all", True)
        new_branch_name = request.data["new_branch"]
        try:
            new_branch = Branch.objects.get(name=new_branch_name)
        except Branch.DoesNotExist:
            return Response("Branch matching query does not exist", status=status.HTTP_404_NOT_FOUND)

        tsfilters = TestSetFilter.objects.filter(pk__in=pks)

        for tsfilter in tsfilters:
            self.check_object_permissions(self.request, tsfilter)

        branch_set = set([tsfilter.branch for tsfilter in tsfilters])
        if len(branch_set) != 1:
            return Response(f"Selected TestSetFilters do not have single common branch to branchoff: {branch_set}", status=status.HTTP_400_BAD_REQUEST)

        old_branch = branch_set.pop()
        new_tsfilters = []
        for old_tsfilter in tsfilters:
            new_tsfilter = copy.deepcopy(old_tsfilter)
            new_tsfilter.pk = None
            new_tsfilter.branch = new_branch
            old_test_lab_path = str(new_tsfilter.test_lab_path)
            new_tsfilter.test_lab_path = old_test_lab_path.replace(str(old_branch), str(new_branch.name), 1)
            new_tsfilter.save()

            new_tsfilter.owners.add(*old_tsfilter.owners.all())
            new_tsfilter.subscribers.add(*old_tsfilter.subscribers.all())
            new_tsfilter.fail_message_type_groups.add(*old_tsfilter.fail_message_type_groups.all())
            new_tsfilter.testline_types.add(*old_tsfilter.testline_types.all())
            new_tsfilters.append(new_tsfilter)

        if should_delete:
            tsfilters.delete()
        else:
            if should_unsubscribe:
                for tsfilter in tsfilters:
                    if should_unsubscribe_all:
                         tsfilter.subscribers.clear()
                    else:
                        if self.request.user in tsfilter.subscribers.all():
                            tsfilter.subscribers.remove(self.request.user)

        return self._serialize_response(new_tsfilters, status=status.HTTP_201_CREATED)


    @swagger_auto_schema(
        description="Method to subscribe to specified TestSetFilter",
        operation_description="Method to subscribe to specified TestSetFilter",
        request_body=no_body,
        responses={
            200: "",
            304: ""
        },
        tags=["api", "TestSetFilter"]
    )
    @action(detail=True, methods=['post'])
    def subscribe(self, request, pk=None):
        regfilter = self.get_object()
        if self.request.user not in regfilter.subscribers.all():
            regfilter.subscribers.add(self.request.user)
            regfilter.save()
            return Response(status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_304_NOT_MODIFIED)


    @swagger_auto_schema(
        description="Method to unsubscribe to specified TestSetFilter",
        operation_description="Method to unsubscribe to specified TestSetFilter",
        request_body=no_body,
        responses={
            200: "",
            304: ""
        },
        tags=["api", "TestSetFilter"]
    )
    @action(detail=True, methods=['post'])
    def unsubscribe(self, request, pk=None):
        regfilter = self.get_object()
        if self.request.user in regfilter.subscribers.all():
            regfilter.subscribers.remove(self.request.user)
            regfilter.save()
            return Response(status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_304_NOT_MODIFIED)


    # def perform_create(self, serializer):
    #     instance = serializer.save()
    #     instance.owners.add(self.request.user)
    #     instance.subscribers.add(self.request.user)

    def get_permissions(self):
        permissions = [permission() for permission in self.permission_classes]
        if self.request.method in ['PUT', 'DELETE']:
            if self.action != 'delete':
                return permissions + [IsOwnerOfObject()]
        if self.request.method in ['POST'] and self.action == "batch_branchoff":
            return permissions + [IsOwnerOfObject()]
        return permissions


class TestRunView(viewsets.ReadOnlyModelViewSet):
    serializer_class = TestRunSerializer
    queryset = TestRun.objects.all()


class TestRunsBasedOnQueryDictinctValues(APIView):
    def get(self, request):
        fields_dict = get_distinct_values_based_on_subscribed_testsetfilters(user=self.request.user)
        return Response(fields_dict)


class TestRunsByTestInstanceDictinctValues(APIView):
    def get(self, request, ti):
        return Response(get_distinct_values_based_on_test_instance(test_instance=ti))


class TestEntityDistinctValuesByTestInstancesOfUser(APIView):
    def get(self, request):
        tsfilters = TestSetFilter.objects.filter(subscribers=self.request.user)
        queryset = TestInstance.objects.filter(
            reduce(lambda q, tsfilter: q | Q(test_set=tsfilter), tsfilters, Q())
        )
        return Response(queryset.order_by('test_entity').values_list('test_entity', flat=True).distinct())


class TestRunsBasedOnQuery(generics.ListAPIView):
    serializer_class = TestRunSerializer
    filterset_class = TestRunFilter
    pagination_class = StandardResultsSetPagination
    ordering_fields = (
        'id',
        'rp_id',
        'test_instance',
        'testline_type',
        'organization',
        'result',
        'env_issue_type',
        'fb',
        'fail_message',
        'comment',
        'test_line',
        'test_suite',
        'builds',
        'ute_exec_url',
        'log_file_url',
        'log_file_url_ext',
        'start_time',
        'end_time',
        'analyzed',
        'exec_trigger',

        "test_instance__test_case_name",
        "test_instance__test_set__test_set_name",
        "test_instance__test_set__branch",
        "test_instance__test_set__test_lab_path",
    )

    def get_queryset(self):
        queryset = TestRun.objects.all()
        tsfilters = TestSetFilter.objects.filter(subscribers=self.request.user)
        if tsfilters.exists():
            queryset = queryset.filter(
                reduce(lambda q, tsfilter: q | Q(test_instance__test_set=tsfilter), tsfilters, Q())
            )
        else:
            queryset = TestRun.objects.none()
        return queryset

class TestRunsByTestInstance(generics.ListAPIView):
    serializer_class = TestRunSerializer
    filterset_class = TestRunFilter
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        # test_instance = self.request.query_params.get("ti", None)
        # if not test_instance:
        #     raise ValidationError(detail="Query parameter 'ti' is required.")
        return TestRun.objects.filter(test_instance=self.kwargs['ti'])


class TestInstancesBasedOnQuery(generics.ListAPIView):
    serializer_class = TestInstanceSerializer
    filterset_class = TestInstanceFilter
    pagination_class = StandardResultsSetPagination
    ordering_fields = (
        'rp_id',
        'test_set__test_set_name',
        'test_set__test_lab_path',
        'test_set__branch__name',
        'testline_type__name',
        'last_passing_logs__utecloud_run_id',
        'test_case_name',
        'organization__name',
        'execution_suspended',
        'no_run_in_rp',
        'test_entity',
        'pass_ratio',
    )

    def get_queryset(self):
        queryset = TestInstance.objects.filter(test_set__subscribers=self.request.user)
        return queryset.annotate(
            testruns_count=Count('test_runs'),
            pass_ratio=Case(
                When(testruns_count=0, then=None),
                default=100 * Count('test_runs', filter=Q(test_runs__result__name="passed")) / Count('test_runs')
            )
        )


class TestRunsAnalyzeToRP(APIView):
    @swagger_auto_schema(
        description="Method to trigger analysis of TestRun to ReportingPortal",
        operation_description="Method to trigger analysis of TestRun to ReportingPortal",
        request_body=testrun_analyze_schema,
        responses={200: ""},
        tags=["api"]
    )
    def post(self, request):
        data = self.request.data
        rp_ids = data["rp_ids"]
        comment = data["comment"]
        pronto = data["pronto"]
        result = data["result"]
        send_to_qc = data["send_to_qc"]
        env_issue_type = data["env_issue_type"]

        result_obj = TestRunResult.objects.get(name=result)
        env_issue_type_obj = EnvIssueType.objects.get(name=env_issue_type) if env_issue_type else None
        test_runs_to_analyze = TestRun.objects.filter(rp_id__in=rp_ids)
        user = self.request.user

        if hasattr(user, 'rp_token') and user.rp_token.token:
            token = user.rp_token.token
        else:
            token = None

        auth_params = utils.get_rp_api_auth_params(token=token)

        celery_tasks.celery_analyze_testruns.delay(
            runs=rp_ids,
            comment=comment,
            pronto=pronto,
            common_build="",
            result=result_obj.name,
            env_issue_type=env_issue_type,
            send_to_qc=send_to_qc,
            auth_params=auth_params
        )
        analyze_kwargs = dict(
            analyzed=True,
            analyzed_by=user,
            comment=comment,
            result=result_obj,
        )

        if result_obj == TestRunResult.objects.get_env_issue_instance():
            analyze_kwargs["env_issue_type"] = env_issue_type_obj
        elif result_obj == TestRunResult.objects.get_failed_instance():
            analyze_kwargs["pronto"] = pronto

        test_runs_to_analyze.update(**analyze_kwargs)

        return Response(status=200)


class TestInstancesSuspendActionToRP(APIView):
    @swagger_auto_schema(
        description="Method to trigger suspension status of TestInstances to ReportingPortal",
        operation_description="Method to trigger suspension status of TestInstances to ReportingPortal",
        request_body=testinstance_suspend_schema,
        responses={200: ""},
        tags=["api"]
    )
    def post(self, request):
        data = self.request.data
        rp_ids = data["rp_ids"]
        suspend = data["suspend"]

        user = self.request.user
        token = user.rp_token.token if hasattr(user, 'rp_token') and user.rp_token.token else None
        auth_params = utils.get_rp_api_auth_params(token=token)

        celery_tasks.celery_suspend_testinstances.delay(
            test_instances=rp_ids,
            suspend_status=suspend,
            auth_params=auth_params
        )

        return Response(status=200)


class TestInstancesSyncSuspendInfoFromRPByIds(APIView):
    @swagger_auto_schema(
        description="Method to sync suspend info of TestInstances from ReportingPortal",
        operation_description="Method to sync suspend info of TestInstances from ReportingPortal",
        request_body=testinstance_sync_by_ids_schema,
        responses={200: "", 400: ""},
        tags=["api"]
    )
    def post(self, request):
        data = self.request.data
        rp_ids = data["rp_ids"]
        user = self.request.user
        token = user.rp_token.token if hasattr(user, 'rp_token') and user.rp_token.token else None
        auth_params = utils.get_rp_api_auth_params(token=token)
        result = test_runs_processing.sync_suspension_status_of_test_instances_by_ids(ti_ids=rp_ids, auth_params=auth_params)
        if len(result["updated"]) > 0:
            return Response(status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_400_BAD_REQUEST)



class PullNotPassedTestrunsByTestSetFilter(APIView):
    def get(self, request, tsfid):
        testset_filter = TestSetFilter.objects.get(pk=tsfid)
        limit = self.request.query_params.get('limit', None)
        content = test_runs_processing.pull_notanalyzed_and_envissue_testruns_by_testset_filter(testset_filter.id, limit)
        return Response(content)


class PullNotPassedTestrunsByAllTestSetFilters(APIView):
    def get(self, request):
        limit = self.request.query_params.get('limit', None)
        content = test_runs_processing.pull_notanalyzed_and_envissue_testruns_by_all_testset_filters(limit)
        return Response(content)


class PullNotPassedTestrunsByAllTestSetFiltersCelery(APIView):
    @swagger_auto_schema(
        description="Pull not analyzed and environment issue test runs from ReportingPortal to DB",
        operation_description="Pull not analyzed and environment issue test runs from ReportingPortal to DB",
        request_body=no_body,
        responses={
            200: "",
        },
        tags=["celery"]
    )
    def get(self, request):
        celery_tasks.celery_pull_notanalyzed_and_envissue_testruns_by_all_testset_filters.delay()
        return Response("OK")


class PullPassedTestrunsByAllTestSetFiltersCelery(APIView):
    @swagger_auto_schema(
        description="Pull passed test runs from ReportingPortal to DB",
        operation_description="Pull passed test runs from ReportingPortal to DB",
        request_body=no_body,
        responses={
            200: "",
        },
        tags=["celery"]
    )
    def get(self, request):
        celery_tasks.celery_pull_passed_testruns_by_all_testset_filters.delay()
        return Response("OK")


class PullAllTestRunsBySelectedTestSetFiltersCelery(APIView):
    @swagger_auto_schema(
        description="Pull all test runs from ReportingPortal to DB by selected Test Set Filters",
        operation_description="Pull all test runs from ReportingPortal to DB by selected Test Set Filters",
        request_body=no_body,
         manual_parameters=[
            limit_rp,
            testsetfilters_param
        ],
        responses={
            200: "",
        },
        tags=["celery"]
    )
    def get(self, request):
        testsetfilters = request.query_params.get('testsetfilters', [])
        taskid = celery_tasks.celery_pull_testruns_by_testsetfilters.delay(testset_filters_ids=[int(_id) for _id in testsetfilters.split(',')], user_ids=[request.user.id])
        return Response(taskid.id)


class GetCeleryTasksStatus(APIView):
    @swagger_auto_schema(
        description="Get celery task's status",
        operation_description="Get celery task's status",
        request_body=no_body,
         manual_parameters=[
            task_id_param,
        ],
        responses={
            200: "",
        },
        tags=["celery"]
    )
    def get(self, request):
        taskid = request.query_params.get('taskid', None)
        res = AsyncResult(taskid)
        res.ready()
        return Response({"ready": res.ready(), "status": res.state})


class CheckIfAllTasksFinished(APIView):
    @swagger_auto_schema(
        description="Get celery task's status",
        operation_description="Get celery task's status",
        request_body=celery_task_ids_list,
        responses={
            200: "",
            400: ""
        },
        tags=["celery"]
    )
    def post(self, request):
        taskids = request.data
        if not taskids:
            return Response(f"You need to specify taskids", status=status.HTTP_400_BAD_REQUEST)
        tasks = []
        for taskid in taskids:
            tasks.append(AsyncResult(taskid).ready())
        return Response({"ready": all(tasks)})



class DownloadLatestPassedLogsToStorage(APIView):
    @swagger_auto_schema(
        description="Trigger download of latest passing logs for each test instance that is observed",
        operation_description="Trigger download of latest passing logs for each test instance that is observed",
        request_body=no_body,
        responses={
            200: "",
        },
        tags=["celery"]
    )
    def get(self, request):
        celery_tasks.celery_download_latest_passed_logs_to_storage.delay()
        return Response("OK")


class DownloadLogsToMirrorStorage(APIView):
    @swagger_auto_schema(
        description="Trigger download of logs to mirror storage",
        operation_description="Trigger download of logs to mirror storage",
        request_body=no_body,
        responses={
            200: "",
        },
        tags=["celery"]
    )
    def get(self, request):
        celery_tasks.celery_download_testrun_logs_to_mirror_storage.delay()
        return Response("OK")


class RemoveOldPassedLogsFromLogStorage(APIView):
    @swagger_auto_schema(
        description="Trigger removal of last passing logs from test instances that are not observed by anyone",
        operation_description="Trigger removal of last passing logs from test instances that are not observed by anyone",
        request_body=no_body,
        responses={
            200: "",
        },
        tags=["celery"]
    )
    def get(self, request):
        celery_tasks.celery_remove_old_passed_logs_from_log_storage.delay()
        return Response("OK")


class RemoveOldMirroredLogsFromLogStorage(APIView):
    @swagger_auto_schema(
        description="Trigger removal of old mirrored logs",
        operation_description="Trigger removal of old mirrored logs",
        request_body=no_body,
        responses={
            200: "",
        },
        tags=["celery"]
    )
    def get(self, request):
        celery_tasks.celery_remove_mirrored_logs.delay()
        return Response("OK")


class SyncSuspensionStatusOfTestInstancesByAllTestSetFilters(APIView):
    @swagger_auto_schema(
        description="Sync suspension status of all test instances by all test set filters",
        operation_description="Sync suspension status of all test instances by all test set filters",
        request_body=no_body,
        responses={
            200: "",
        },
        tags=["celery"]
    )
    def get(self, request):
        celery_tasks.celery_sync_suspension_status_of_test_instances_by_all_testset_filters.delay()
        return Response("OK")


class FillEmptyTestInstancesWithTheirRPIds(APIView):
    def get(self, request):
        resp = test_runs_processing.fill_empty_test_instances_with_their_rp_ids()
        return Response(resp)



class SyncNorunDataOfAllTestInstances(APIView):
    @swagger_auto_schema(
        description="Sync no_run info from all test instances that are being subscribed by test sets (with subscribers)",
        operation_description="Sync no_run info from all test instances that are being subscribed by test sets (with subscribers)",
        request_body=no_body,
        responses={
            200: "",
        },
        tags=["celery"]
    )
    def get(self, request):
        celery_tasks.celery_sync_norun_data_of_all_test_instances.delay()
        return Response("OK")



class SummaryStatisticsView(APIView):
    @swagger_auto_schema(
        description="Return summary information of the subscribed test sets",
        operation_description="Return summary information of the subscribed test sets",
        request_body=no_body,
        responses={
            200: "",
        },
        tags=["summary", 'api']
    )
    def get(self, request):

        observed_test_instances = TestInstance.objects.filter(test_set__subscribers=self.request.user)
        observed_test_runs = TestRun.objects.filter(test_instance__test_set__subscribers=self.request.user)

        current_fb = FeatureBuild.objects.all().order_by("-name").first()
        testruns_in_current_fb = observed_test_runs.filter(fb=current_fb)
        na_testruns = testruns_in_current_fb.filter(result=TestRunResult.objects.get_not_analyzed_instance())
        passed_testruns = testruns_in_current_fb.filter(result=TestRunResult.objects.get_passed_instance())
        envissue_testruns = testruns_in_current_fb.filter(result=TestRunResult.objects.get_env_issue_instance())
        failed_testruns = testruns_in_current_fb.filter(result=TestRunResult.objects.get_failed_instance())
        blocked_testruns = testruns_in_current_fb.filter(result=TestRunResult.objects.get_blocked_instance())
        suspended_tis = observed_test_instances.filter(execution_suspended=True)
        norun_tis = observed_test_instances.filter(no_run_in_rp=True)

        if na_testruns:
            top_na, top_na_count = na_testruns.values_list('fail_message').annotate(fm_count=Count('fail_message')).order_by('-fm_count').first()
            na_testruns.count()
        else:
            top_na, top_na_count = "No not_analyzed runs to display", 0

        if envissue_testruns:
            top_envissue, top_envissue_count = envissue_testruns.values_list('comment').annotate(comment_count=Count('comment')).order_by('-comment_count').first()
        else:
            top_envissue, top_envissue_count = "No env_issue runs to display", 0

        response = {
            "env_issues": {
                "count": envissue_testruns.count(),
                "top": top_envissue,
                "top_count": top_envissue_count,
                "top_count_percent": int((top_envissue_count/envissue_testruns.count())*100) if envissue_testruns else 0
            },
            "not_analyzed": {
                "count": na_testruns.count(),
                "top": top_na,
                "top_count": top_na_count,
                "top_count_percent": int((top_na_count/na_testruns.count())*100) if na_testruns else 0
            },
            "passed": {
                "count": passed_testruns.count()
            },
            "failed": {
                "count": failed_testruns.count()
            },
            "blocked": {
                "count": blocked_testruns.count()
            },
            "all_in_fb_count": testruns_in_current_fb.count(),
            "test_instances":
            {
                "suspended": suspended_tis.count(),
                "no_run": norun_tis.count(),
                "all": observed_test_instances.count()
            },
            "current_fb": current_fb.name
        }
        return Response(response)
