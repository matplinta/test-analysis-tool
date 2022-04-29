from dataclasses import fields
from functools import reduce
from django.shortcuts import render
from rest_framework import permissions, authentication
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from rest_framework.decorators import action
from django.views.generic import ListView
from dj_rest_auth.views import LogoutView
from rest_framework.settings import api_settings
from rest_framework import generics, mixins, views
from django.conf import settings
from django.contrib.auth.models import User
from itertools import chain
from django.db.models import Q
import distutils
import distutils.util
from django.core.serializers import serialize
from rest_framework import serializers
from .serializers import (
    TestInstanceSerializer,
    TestRunSerializer, 
    TestlineTypeSerializer, 
    RegressionFilterSerializer, 
    TestSetSerializer, 
    FailMessageTypeSerializer,
    FailMessageTypeGroupSerializer,
    EnvIssueTypeSerializer,
    TestRunResultSerializer,
    FeatureBuildSerializer,
    UserSerializer
)

from .models import (
    FailMessageTypeGroup,
    FeatureBuild,
    get_fb_info_based_on_date,
    Organization, 
    TestRunResult, 
    TestlineType, 
    TestSet, 
    TestInstance, 
    TestRun, 
    RegressionFilter, 
    EnvIssueType, 
    FailMessageType,
    FailMessageTypeGroup,
)

from .filters import TestRunFilter

from rep_portal.api import RepPortal
import json
from datetime import datetime
import pytz
import logging

from .tasks import pull_tcs


class AccessingRestrictedDataError(Exception):
    pass

class TestRunWithSuchRPIDAlreadyExists(Exception):
    pass


def create_testrun_obj_based_on_rp_data(rp_test_run):
    def return_empty_if_none(elem):
        return elem if elem is not None else ""

    rp_id = rp_test_run["id"]
    if TestRun.objects.filter(rp_id=rp_id).exists():
        raise TestRunWithSuchRPIDAlreadyExists(rp_id)
    timezone = pytz.timezone(settings.TIME_ZONE)
    start = datetime.strptime(rp_test_run["start"].split(".")[0], '%Y-%m-%dT%H:%M:%S')
    start = timezone.localize(start)
    end = datetime.strptime(rp_test_run["end"].split(".")[0], '%Y-%m-%dT%H:%M:%S')
    end = timezone.localize(end)

    fb_name, fb_start, fb_end = get_fb_info_based_on_date(end)
    fb, _ = FeatureBuild.objects.get_or_create(name=fb_name, start_time=fb_start, end_time=fb_end)
    
    test_set, _ = TestSet.objects.get_or_create(
        name=rp_test_run["qc_test_set"],
        test_lab_path=rp_test_run["qc_test_instance"].get("m_path", "")
    )
    test_instance, _ = TestInstance.objects.get_or_create(
        test_set=test_set,
        test_case_name=rp_test_run["test_case"]["name"]
    )
    testline_type, _ = TestlineType.objects.get_or_create(
        name=return_empty_if_none(rp_test_run['test_col']["testline_type"])
    )
    organization, _ = Organization.objects.get_or_create(
        name=return_empty_if_none(rp_test_run["qc_test_instance"]["organization"])
    )
    env_issue_type, _ = EnvIssueType.objects.get_or_create(
        name=return_empty_if_none(rp_test_run["env_issue_type"])
    )
    result, _ = TestRunResult.objects.get_or_create(name=rp_test_run["result"])
    hyperlink_set = rp_test_run.get("hyperlink_set", "")
    if hyperlink_set:
        ute_exec_url=rp_test_run["hyperlink_set"].get("test_logs_url", "")
        log_file_url=rp_test_run["hyperlink_set"].get("log_file_url", "")
    else:
        ute_exec_url, log_file_url = "", ""
    tr = TestRun(
        rp_id=rp_id,
        fb=fb,
        test_instance=test_instance,
        testline_type=testline_type,
        organization=organization,
        result=result,
        env_issue_type=env_issue_type,
        comment=rp_test_run["comment"],
        fail_message=rp_test_run["fail_message"],
        test_line=rp_test_run["test_line"],
        test_suite=rp_test_run["test_suite"],
        builds=rp_test_run["builds"],
        ute_exec_url=ute_exec_url,
        log_file_url=log_file_url,
        # log_file_url_ext
        start_time=start,
        end_time=end,
        # analyzed
        )
    tr.save()
    return tr


class LogoutViewEx(LogoutView):
    authentication_classes = (authentication.TokenAuthentication,)
    permission_classes = (IsAuthenticated,)  


class FailMessageTypeView(viewsets.ModelViewSet):
    serializer_class = FailMessageTypeSerializer
    queryset = FailMessageType.objects.all()
    pagination_class = None

    @action(detail=False, url_path="my")
    def my(self, request):
        regfilters = FailMessageType.objects.filter(author=request.user)
        serializer = self.get_serializer(regfilters, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class FailMessageTypeGroupView(viewsets.ModelViewSet):
    serializer_class = FailMessageTypeGroupSerializer
    queryset = FailMessageTypeGroup.objects.all()
    pagination_class = None

    @action(detail=False, url_path="my")
    def my(self, request):
        regfilters = FailMessageTypeGroup.objects.filter(author=request.user)
        serializer = self.get_serializer(regfilters, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class TestRunView(viewsets.ModelViewSet):
    # authentication_classes = (authentication.TokenAuthentication,)
    # permission_classes = (IsAuthenticated,)  
    serializer_class = TestRunSerializer
    queryset = TestRun.objects.all()

    @action(detail=True, methods=['put'], url_path="analyze")
    def analyze(self, request, pk=None):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(analyzed=True, analyzed_by=self.request.user)
        return Response(serializer.data)


# class AnalyzeTestRunView(mixins.RetrieveModelMixin, mixins.UpdateModelMixin,
#                          viewsets.GenericViewSet):
#     serializer_class = TestRunSerializer
#     queryset = TestRun.objects.all()

#     def perform_update(self, serializer):
#         serializer.save(analyzed=True, analyzed_by=self.request.user)


class TestlineTypeView(viewsets.ModelViewSet):
    serializer_class = TestlineTypeSerializer
    queryset = TestlineType.objects.all()
    pagination_class = None


class TestsSetView(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)   
    serializer_class = TestSetSerializer
    queryset = TestSet.objects.all()


class RegressionFilterView(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)   
    serializer_class = RegressionFilterSerializer
    queryset = RegressionFilter.objects.all()


    # @action(detail=False, url_path="other")
    # def other(self, request):
    #     regfilters = request.user.owned_reg_filters.all()
    #     serializer = self.get_serializer(regfilters, many=True)
    #     return Response(serializer.data)


    @action(detail=False, url_path="owned")
    def user_is_owner(self, request):
        regfilters = RegressionFilter.objects.filter(owners=request.user)

        page = self.paginate_queryset(regfilters)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(regfilters, many=True)
        return Response(serializer.data)


    @action(detail=False, url_path="subscribed")
    def user_is_subscribed(self, request):
        regfilters = RegressionFilter.objects.filter(subscribers=request.user)

        page = self.paginate_queryset(regfilters)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(regfilters, many=True)
        return Response(serializer.data)


    def perform_create(self, serializer):
        instance = serializer.save()
        instance.owners.add(self.request.user)
        instance.subscribers.add(self.request.user)


class TestRunsBasedOnRegressionFiltersView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)   
    serializer_class = TestRunSerializer

    def get_queryset(self):
        queryset = TestRun.objects.all()
        rfid = self.kwargs['rfid']
        regression_filter = RegressionFilter.objects.get(pk=rfid)
        return queryset.filter(testline_type=regression_filter.testline_type, 
                               test_instance__test_set=regression_filter.test_set)


# class TestRunsBasedOnAllSubscribedRegressionFiltersView(generics.ListAPIView):
#     permission_classes = (IsAuthenticated,)   
#     serializer_class = TestRunSerializer

#     def get_queryset(self):
#         queryset = TestRun.objects.all()
#         rfid = self.kwargs['rfid']
#         regression_filter = RegressionFilter.objects.get(pk=rfid)
#         # if test_filter.user != self.request.user:
#         #     raise AccessingRestrictedDataError(f"You {self.request.user} do not have access to TestFilter with id={rfid}")
#         return queryset.filter(testline_type=regression_filter.testline_type, 
#                                test_instance__test_set=regression_filter.test_set)

class TestRunsBasedOnQueryDictinctValues(APIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = TestRunSerializer

    def get(self, request):
        fields_dict = {}

        def get_distinct_values_and_serialize(field, model, serializer, order_by_param=None):
            order_by_param = order_by_param if order_by_param else field
            distinct_values = queryset.order_by(field).distinct(field).values_list(field, flat=True)
            objects = model.objects.filter(pk__in=distinct_values)
            data = serialize("json", objects)
            fields_dict[field] = json.loads(data)

            # serializer = serializer(objects, many=True)
            # fields_dict[field] = serializer.data
        
        queryset = TestRun.objects.all()
        regfilters = RegressionFilter.objects.filter(subscribers=request.user)
        queryset = queryset.filter(
            reduce(lambda q, reg_filter: q | Q(testline_type=reg_filter.testline_type, 
                                               test_instance__test_set=reg_filter.test_set), regfilters, Q())
        )

        fields_dict["regfilters"] = json.loads(serialize("json", regfilters))
        fields_dict['analyzed'] = queryset.order_by('analyzed').distinct('analyzed').values_list("analyzed", flat=True)
        get_distinct_values_and_serialize('test_instance', TestInstance, TestInstanceSerializer) #, "test_instance__id")
        get_distinct_values_and_serialize('fb', FeatureBuild, FeatureBuildSerializer)
        get_distinct_values_and_serialize('result', TestRunResult, TestRunResultSerializer)
        get_distinct_values_and_serialize('testline_type', TestlineType, TestlineTypeSerializer)
        get_distinct_values_and_serialize('env_issue_type', EnvIssueType, EnvIssueTypeSerializer)
        get_distinct_values_and_serialize('analyzed_by', User, UserSerializer)
        
        return Response(fields_dict)


class TestRunsBasedOnQuery(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)   
    serializer_class = TestRunSerializer
    filterset_class = TestRunFilter
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
        "test_set__name",
        "test_set__branch",
        "test_set__test_lab_path",
    )

    def get_queryset(self):
        queryset = TestRun.objects.all()
        regfilters = RegressionFilter.objects.filter(subscribers=self.request.user)
        queryset = queryset.filter(
            reduce(lambda q, reg_filter: q | Q(testline_type=reg_filter.testline_type, 
                                               test_instance__test_set=reg_filter.test_set), regfilters, Q())
        )
        return queryset

    # def get_queryset(self):
    #     queryset = TestRun.objects.all()
    #     reg_filters = self.request.query_params.get('regression_filter')
    #     test_instance = self.request.query_params.get('test_instance')
    #     fb = self.request.query_params.get('fb')
    #     result = self.request.query_params.get('result')
    #     analyzed = self.request.query_params.get('analyzed')
    #     analyzed_by = self.request.query_params.get('analyzed_by')
    #     testline_type = self.request.query_params.get('testline_type')
    #     env_issue_type = self.request.query_params.get('env_issue_type')
    #     if reg_filters is not None:
    #         reg_filters = [RegressionFilter.objects.get(pk=rfid) for rfid in reg_filters.split(',')]
    #         queryset = queryset.filter(
    #             reduce(lambda q, reg_filter: q | Q(testline_type=reg_filter.testline_type, 
    #                                                test_instance__test_set=reg_filter.test_set), reg_filters, Q())
    #         )
    #     if test_instance is not None:
    #         test_instances = [TestInstance.objects.get(pk=ti_id) for ti_id in test_instance.split(',')]
    #         queryset = queryset.filter(
    #             reduce(lambda q, test_instance: q | Q(test_instance=test_instance), test_instances, Q())
    #         )
    #     if result is not None:
    #         results = [TestRunResult.objects.get(pk=result_name) for result_name in result.split(',')]
    #         queryset = queryset.filter(
    #             reduce(lambda q, res: q | Q(result=res), results, Q())
    #         )
    #     if analyzed is not None:
    #         analyzed = bool(distutils.util.strtobool(analyzed))
    #         queryset = queryset.filter(analyzed=analyzed)
    #     if analyzed_by is not None:
    #         queryset = queryset.filter(analyzed_by__username=analyzed_by)
    #     if fb is not None:
    #         queryset = queryset.filter(fb__name=fb)
    #     return queryset




# class LoadTestRunsToDBView(APIView):
#     # authentication_classes = (authentication.TokenAuthentication,)
#     permission_classes = (IsAuthenticated,)   
    
#     def get(self, request):
#         filters = {
#             "result": "not analyzed",
#             "testline_type": "CLOUD_5G_I_LO_AP_LO_SANSA_FS_ECPRI_CMWV_TDD",
#             "test_set": "5GC001085-B_Intra-frequency_inter-gNB_neighbor_NRREL_addition_-_Previously_established_Xn",
#             "test_lab_path": "Root\Test_Sets\Trunk\RAN_L2_SW_KRK_2\\5GC001085_ANR_for_SA_intra-NR_intra-frequency_UE_based"
#         }
#         data = RepPortal().get_data_from_testruns(limit=15, filters=filters)
#         for test_run in data:
#             try:
#                 create_testrun_obj_based_on_rp_data(test_run)
#             except TestRunWithSuchRPIDAlreadyExists as e:
#                 logging.info(str(e))
#         # content = {'message': str(data)}
#         return Response(data)


class LoadTestRunsToDBBasedOnRegressionFilter(APIView):
    # authentication_classes = (authentication.TokenAuthentication,)
    permission_classes = (IsAuthenticated,)   
    
    def get(self, request, rfid):
        tr_list = []
        tr_skipped_list = []
        regression_filter = RegressionFilter.objects.get(pk=rfid)
        limit = self.request.query_params.get('limit')
        limit = regression_filter.limit if limit is None else limit
        filters = {
            "result": "not analyzed",
            "testline_type": regression_filter.testline_type.name,
            "test_set": regression_filter.test_set.name,
            "test_lab_path": regression_filter.test_set.test_lab_path
        }
        data = RepPortal().get_data_from_testruns(limit=limit, filters=filters)
        for test_run in data:
            try:
                tr = create_testrun_obj_based_on_rp_data(test_run)
                tr_list.append(tr.rp_id)
            except TestRunWithSuchRPIDAlreadyExists as e:
                tr_skipped_list.append(str(e))
                logging.info(f"{type(e).__name__} was raised for rp_id={e}")
        content = {
            'loaded_new_runs': tr_list,
            'skipped_runs': tr_skipped_list
        }
        return Response(content)


class LoadTestRunsToDBBasedOnAllRegressionFilters(APIView):
    # authentication_classes = (authentication.TokenAuthentication,)
    permission_classes = (IsAuthenticated,)   
    
    def get(self, request):
        regression_filters = RegressionFilter.objects.all()
        tr_by_rf = {regression_filter.id: [] for regression_filter in regression_filters} 
        tr_by_rf_skipped = {regression_filter.id: [] for regression_filter in regression_filters} 
        for regression_filter in regression_filters:
            filters = {
                "result": "not analyzed",
                "testline_type": regression_filter.testline_type.name,
                "test_set": regression_filter.test_set.name,
                "test_lab_path": regression_filter.test_set.test_lab_path
            }
            data = RepPortal().get_data_from_testruns(limit=regression_filter.limit, filters=filters)
            for test_run in data:
                try:
                    tr = create_testrun_obj_based_on_rp_data(test_run)
                    tr_by_rf[regression_filter.id].append(tr.rp_id)
                except TestRunWithSuchRPIDAlreadyExists as e:
                    tr_by_rf_skipped[regression_filter.id].append(str(e))
                    logging.info(f"{type(e).__name__} was raised for rp_id={e}")
        content = {
            'loaded_new_runs': tr_by_rf,
            'skipped_runs': tr_by_rf_skipped
        }
        return Response(content)







class CheckView(APIView):
    # authentication_classes = (authentication.TokenAuthentication,)
    # permission_classes = (IsAuthenticated,)   
    
    def get(self, request):
        content = {'message': '{}'.format(str(api_settings.DEFAULT_AUTHENTICATION_CLASSES))}
        return Response(content)


class HelloView(APIView):
    # authentication_classes = (authentication.TokenAuthentication,)
    # permission_classes = (IsAuthenticated,)   
    
    def get(self, request):
        # lol = kwargs.get("lol")
        pull_tcs.delay()
        return Response(200)


class TestAuthView(APIView):
    authentication_classes = (authentication.TokenAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, format=None):
        return Response("Hello {0} {1}!".format(request.user, str(api_settings.DEFAULT_AUTHENTICATION_CLASSES)))

    def post(self, request, format=None):
        return Response("Hello {0}! Posted!".format(request.user))


class TestSessView(APIView):
    authentication_classes = (authentication.SessionAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, format=None):
        return Response("Hello {0}!".format(request.user))

    def post(self, request, format=None):
        return Response("Hello {0}! Posted!".format(request.user))


 


