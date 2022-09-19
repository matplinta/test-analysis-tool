from dataclasses import fields
from functools import reduce
from sre_constants import SUCCESS
from urllib import response
from django.shortcuts import render
from rest_framework import permissions, authentication
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework import status
from django.views.generic import ListView
from dj_rest_auth.views import LogoutView
from rest_framework import generics, mixins, views
from django.conf import settings
from django.contrib.auth.models import User
from itertools import chain
from django.db.models import Q
import distutils
import distutils.util
from django.core.serializers import serialize
from rest_framework import serializers
from drf_yasg.utils import swagger_auto_schema, no_body

from backend.permissions import IsAuthorOfObject
from backend.openapi_schemes import *
from .permissions import IsOwnerOfObject, IsSubscribedToObject

from .serializers import (
    TestInstanceSerializer,
    TestRunSerializer, 
    TestlineTypeSerializer, 
    TestSetFilterSerializer,
    FailMessageTypeSerializer,
    FailMessageTypeGroupSerializer,
    EnvIssueTypeSerializer,
    TestRunResultSerializer,
    FeatureBuildSerializer,
    UserSerializer,
    BranchSerializer,
    LastPassingLogsSerializer
)

from .models import (
    Branch,
    FailMessageTypeGroup,
    FeatureBuild,
    Organization, 
    TestRunResult, 
    TestlineType, 
    TestSetFilter, 
    TestInstance, 
    TestRun, 
    EnvIssueType, 
    FailMessageType,
    FailMessageTypeGroup,
    LastPassingLogs
)

from .filters import TestRunFilter
from .pagination import StandardResultsSetPagination
import json
import copy

from . import test_runs_processing
from . import tasks as celery_tasks


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
        serializer.save(author=self.request.user)

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
        serializer.save(author=self.request.user)

    def get_permissions(self):
        permissions = [permission() for permission in self.permission_classes]
        if self.request.method in ['PUT', 'DELETE']:
            return permissions + [IsAuthorOfObject()]
        return permissions



class TestlineTypeView(viewsets.ModelViewSet):
    serializer_class = TestlineTypeSerializer
    queryset = TestlineType.objects.all()
    pagination_class = None


class BranchView(viewsets.ModelViewSet):
    serializer_class = BranchSerializer
    queryset = Branch.objects.all()
    pagination_class = None


class TestRunResultView(viewsets.ModelViewSet):
    serializer_class = TestRunResultSerializer
    queryset = TestRunResult.objects.all()
    pagination_class = None


class EnvIssueTypeView(viewsets.ModelViewSet):
    serializer_class = EnvIssueTypeSerializer
    queryset = EnvIssueType.objects.all()
    pagination_class = None


class LastPassingLogsView(viewsets.ModelViewSet):
    serializer_class = LastPassingLogsSerializer
    queryset = LastPassingLogs.objects.all()
    pagination_class = None


class TestInstanceView(viewsets.ReadOnlyModelViewSet):
    serializer_class = TestInstanceSerializer
    queryset = TestInstance.objects.all()
    pagination_class = None


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
            new_tsfilters.append(new_tsfilter)

        if should_delete:
            tsfilters.delete()
        else:
            if should_unsubscribe:
                for tsfilter in tsfilters:
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


class TestRunView(viewsets.ModelViewSet):
    serializer_class = TestRunSerializer
    queryset = TestRun.objects.all()


# class TestRunsBasedOnRegressionFiltersView(generics.ListAPIView):
#     serializer_class = TestRunSerializer

#     def get_queryset(self):
#         queryset = TestRun.objects.all()
#         rfid = self.kwargs['rfid']
#         regression_filter = TestSetFilter.objects.get(pk=rfid)
#         return queryset.filter(testline_type=regression_filter.testline_type, 
#                                test_instance__test_set=regression_filter.test_set)


class TestRunsBasedOnQueryDictinctValues(APIView):
    def get_distinct_values_based_on_subscribed_regfilters(self):
        fields_dict = {}
        def get_distinct_values_and_serialize(field, model, serializer=None, order_by_param=None, key_override=None):
            order_by_param = order_by_param if order_by_param else field
            distinct_values = queryset.order_by(order_by_param).distinct(field).values_list(field, flat=True)
            objects = model.objects.filter(pk__in=distinct_values)
            data = serialize("json", objects)
            key = field if not key_override else key_override
            fields_dict[key] = json.loads(data)

        queryset = TestRun.objects.all()
        tsfilters = TestSetFilter.objects.filter(subscribers=self.request.user)
        queryset = queryset.filter(
            reduce(lambda q, reg_filter: q | Q(testline_type=reg_filter.testline_type, 
                                               test_instance__test_set=reg_filter), tsfilters, Q())
        )

        fields_dict["tsfilters"] = json.loads(serialize("json", tsfilters))
        fields_dict['analyzed'] = queryset.order_by('analyzed').distinct('analyzed').values_list("analyzed", flat=True)
        get_distinct_values_and_serialize('test_instance', TestInstance, TestInstanceSerializer)
        get_distinct_values_and_serialize('fb', FeatureBuild, FeatureBuildSerializer, order_by_param='fb__name')
        get_distinct_values_and_serialize('result', TestRunResult, TestRunResultSerializer)
        get_distinct_values_and_serialize('testline_type', TestlineType, TestlineTypeSerializer)
        get_distinct_values_and_serialize('env_issue_type', EnvIssueType, EnvIssueTypeSerializer)
        get_distinct_values_and_serialize('analyzed_by', User, UserSerializer)
        get_distinct_values_and_serialize('test_instance__test_set__branch', Branch, key_override="branch",
                                          order_by_param="test_instance__test_set__branch__name")
        test_set_distinct_values = tsfilters.order_by('test_set_name').distinct('test_set_name').values_list('test_set_name', flat=True)
        fields_dict['test_set_name'] = [{'pk': elem} for elem in list(test_set_distinct_values)]
        return fields_dict


    def get(self, request):
        fields_dict = self.get_distinct_values_based_on_subscribed_regfilters()
        return Response(fields_dict)


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

        "test_instance__test_case_name", 
        "test_instance__test_set__test_set_name",
        "test_instance__test_set__branch",
        "test_instance__test_set__test_lab_path",
    )

    def get_queryset(self):
        queryset = TestRun.objects.all()
        tsfilters = TestSetFilter.objects.filter(subscribers=self.request.user)
        queryset = queryset.filter(
            reduce(lambda q, reg_filter: q | Q(testline_type=reg_filter.testline_type, 
                                               test_instance__test_set=reg_filter), tsfilters, Q())
        )
        return queryset


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
        result = data["result"]
        env_issue_type = data["env_issue_type"]
        
        result_obj = TestRunResult.objects.get(name=result)
        env_issue_type_obj = EnvIssueType.objects.get(name=env_issue_type)
        test_runs_to_analyze = TestRun.objects.filter(rp_id__in=rp_ids)
        user = self.request.user

        if hasattr(user, 'rp_token') and user.rp_token.token:
            token = user.rp_token.token
        else:
            token = None

        celery_tasks.celery_analyze_testruns.delay(
            runs=rp_ids,
            comment=comment, 
            common_build="", 
            result=result_obj.name, 
            env_issue_type=env_issue_type,
            token=token
        )

        test_runs_to_analyze.update(analyzed=True, analyzed_by=user, comment=comment, result=result_obj, env_issue_type=env_issue_type_obj)

        return Response(status=200)


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


class SummaryStatisticsView(APIView): #TODO
    pass

