from django.shortcuts import render
from rest_framework import permissions, authentication
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from django.views.generic import ListView
from rest_framework import generics

from dj_rest_auth.views import LogoutView
from rest_framework.settings import api_settings

from .serializers import TestRunSerializer, TestlineTypeSerializer, TestsFilterSerializer, TestSetSerializer
from .models import EnvIssueType, Organization, TestInstance, TestRun, TestRunResult, TestlineType, TestsFilter, TestSet

from rp_data_processing.data_handler import RepPortal
import json
from datetime import datetime
import pytz
import logging


class AccessingRestrictedDataError(Exception):
    pass

class TestRunWithSuchRPIDAlreadyExists(Exception):
    pass


class TestRunView(viewsets.ModelViewSet):
    serializer_class = TestRunSerializer
    queryset = TestRun.objects.all()


class TestlineTypeView(viewsets.ModelViewSet):
    serializer_class = TestlineTypeSerializer
    queryset = TestlineType.objects.all()


class TestsSetView(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)   
    serializer_class = TestSetSerializer
    queryset = TestSet.objects.all()


class TestsFilterView(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)   
    serializer_class = TestsFilterSerializer
    queryset = TestsFilter.objects.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class UserTestsFilterView(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = TestsFilterSerializer
    queryset = TestsFilter.objects.all()

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)


class TestRunsBasedOnTestsFiltersView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)   
    serializer_class = TestRunSerializer

    def get_queryset(self):
        queryset = TestRun.objects.all()
        tf_id = self.kwargs['tf_id']
        test_filter = TestsFilter.objects.get(pk=tf_id)
        if test_filter.user != self.request.user:
            raise AccessingRestrictedDataError(f"You {self.request.user} do not have access to TestFilter with id={tf_id}")
        return queryset.filter(testline_type=test_filter.testline_type, 
                               test_instance__test_set=test_filter.test_set)


def create_testrun_obj_based_on_rp_data(rp_test_run):
    def return_empty_if_none(elem):
        return elem if elem is not None else ""

    rp_id = rp_test_run["id"]
    if TestRun.objects.filter(rp_id=rp_id).exists():
        raise TestRunWithSuchRPIDAlreadyExists(rp_id)
    timezone = pytz.timezone("UTC")
    start = datetime.strptime(rp_test_run["start"].split(".")[0], '%Y-%m-%dT%H:%M:%S')
    start = timezone.localize(start)
    end = datetime.strptime(rp_test_run["end"].split(".")[0], '%Y-%m-%dT%H:%M:%S')
    end = timezone.localize(end)
    test_set, _ = TestSet.objects.get_or_create(
        name=rp_test_run["qc_test_set"],
        test_lab_path=rp_test_run["qc_test_instance"]["m_path"]
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
    tr = TestRun(
        rp_id=rp_id,
        test_instance=test_instance,
        testline_type=testline_type,
        organization=organization,
        result=result,
        env_issue_type=env_issue_type,
        fail_message=rp_test_run["fail_message"],
        test_line=rp_test_run["test_line"],
        test_suite=rp_test_run["test_suite"],
        builds=rp_test_run["builds"],
        ute_exec_url=rp_test_run["hyperlink_set"]["test_logs_url"],
        log_file_url=rp_test_run["hyperlink_set"]["log_file_url"],
        # log_file_url_ext
        start_time=start,
        end_time=end,
        # analyzed
        )
    tr.save()


class LoadTestRunsToDBView(APIView):
    # authentication_classes = (authentication.TokenAuthentication,)
    permission_classes = (IsAuthenticated,)   
    
    def get(self, request):
        filters = {
            "result": "not analyzed",
            "testline_type": "CLOUD_5G_I_LO_AP_LO_SANSA_FS_ECPRI_CMWV_TDD",
            "test_set": "5GC001085-B_Intra-frequency_inter-gNB_neighbor_NRREL_addition_-_Previously_established_Xn",
            "test_lab_path": "Root\Test_Sets\Trunk\RAN_L2_SW_KRK_2\\5GC001085_ANR_for_SA_intra-NR_intra-frequency_UE_based"
        }
        data = RepPortal().get_data_from_testruns(limit=15, filters=filters)
        for test_run in data:
            try:
                create_testrun_obj_based_on_rp_data(test_run)
            except TestRunWithSuchRPIDAlreadyExists as e:
                logging.info(str(e))
        # content = {'message': str(data)}
        return Response(data)


class LoadTestRunsToDBBasedOnTestFilter(APIView):
    # authentication_classes = (authentication.TokenAuthentication,)
    permission_classes = (IsAuthenticated,)   
    
    def get(self, request, tf_id):
        test_filter = TestsFilter.objects.get(pk=tf_id)
        filters = {
            "testline_type": test_filter.testline_type.name,
            "test_set": test_filter.test_set.name,
            "test_lab_path": test_filter.test_set.test_lab_path
        }
        data = RepPortal().get_data_from_testruns(limit=15, filters=filters)
        for test_run in data:
            try:
                create_testrun_obj_based_on_rp_data(test_run)
            except TestRunWithSuchRPIDAlreadyExists as e:
                logging.info(str(e))
        # content = {'message': str(data)}
        return Response(data)


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
        content = {'message': 'Hello, World! {}'.format(str(HelloView.authentication_classes))}
        return Response(content)


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


class LogoutViewEx(LogoutView):
    authentication_classes = (authentication.TokenAuthentication,)
    permission_classes = (IsAuthenticated,)   


