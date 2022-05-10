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

from .test_runs_processing import *


class LogoutViewEx(LogoutView):
    authentication_classes = (authentication.TokenAuthentication,)
    permission_classes = (IsAuthenticated,)  


class FailMessageTypeView(viewsets.ModelViewSet):
    serializer_class = FailMessageTypeSerializer
    queryset = FailMessageType.objects.all()
    pagination_class = None

    @action(detail=False, url_path="my")
    def my(self, request):
        fmts = FailMessageType.objects.filter(author=request.user)
        serializer = self.get_serializer(fmts, many=True)
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


class TestRunsBasedOnRegressionFiltersView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)   
    serializer_class = TestRunSerializer

    def get_queryset(self):
        queryset = TestRun.objects.all()
        rfid = self.kwargs['rfid']
        regression_filter = RegressionFilter.objects.get(pk=rfid)
        return queryset.filter(testline_type=regression_filter.testline_type, 
                               test_instance__test_set=regression_filter.test_set)


class TestRunsBasedOnQueryDictinctValues(APIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = TestRunSerializer

    def get(self, request):
        fields_dict = {}

        def get_distinct_values_and_serialize(field, model, serializer, order_by_param=None):
            order_by_param = order_by_param if order_by_param else field
            distinct_values = queryset.order_by(order_by_param).distinct(field).values_list(field, flat=True)
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
        get_distinct_values_and_serialize('fb', FeatureBuild, FeatureBuildSerializer, order_by_param='fb__name')
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
        "test_instance__test_set__name",
        "test_instance__test_set__branch",
        "test_instance__test_set__test_lab_path",
    )

    def get_queryset(self):
        queryset = TestRun.objects.all()
        regfilters = RegressionFilter.objects.filter(subscribers=self.request.user)
        queryset = queryset.filter(
            reduce(lambda q, reg_filter: q | Q(testline_type=reg_filter.testline_type, 
                                               test_instance__test_set=reg_filter.test_set), regfilters, Q())
        )
        return queryset


class LoadTestRunsToDBBasedOnRegressionFilter(APIView):
    # authentication_classes = (authentication.TokenAuthentication,)
    permission_classes = (IsAuthenticated,)   
    
    def get(self, request, rfid):
        regression_filter = RegressionFilter.objects.get(pk=rfid)
        limit = self.request.query_params.get('limit', None)
        content = pull_and_analyze_notanalyzed_testruns_by_regfilter(regression_filter.id, limit)
        return Response(content)


class LoadTestRunsToDBBasedOnAllRegressionFilters(APIView):
    # authentication_classes = (authentication.TokenAuthentication,)
    permission_classes = (IsAuthenticated,)   
    
    def get(self, request):
        limit = self.request.query_params.get('limit', None)
        content = pull_and_analyze_notanalyzed_testruns_by_all_regfilters(limit)
        return Response(content)




# class CheckView(APIView):
#     # authentication_classes = (authentication.TokenAuthentication,)
#     # permission_classes = (IsAuthenticated,)   
    
#     def get(self, request):
#         content = {'message': '{}'.format(str(api_settings.DEFAULT_AUTHENTICATION_CLASSES))}
#         return Response(content)


# class HelloView(APIView):
#     # authentication_classes = (authentication.TokenAuthentication,)
#     # permission_classes = (IsAuthenticated,)   
    
#     def get(self, request):
#         # lol = kwargs.get("lol")
#         pull_tcs.delay()
#         return Response(200)


# class TestAuthView(APIView):
#     authentication_classes = (authentication.TokenAuthentication,)
#     permission_classes = (permissions.IsAuthenticated,)

#     def get(self, request, format=None):
#         return Response("Hello {0} {1}!".format(request.user, str(api_settings.DEFAULT_AUTHENTICATION_CLASSES)))

#     def post(self, request, format=None):
#         return Response("Hello {0}! Posted!".format(request.user))


# class TestSessView(APIView):
#     authentication_classes = (authentication.SessionAuthentication,)
#     permission_classes = (permissions.IsAuthenticated,)

#     def get(self, request, format=None):
#         return Response("Hello {0}!".format(request.user))

#     def post(self, request, format=None):
#         return Response("Hello {0}! Posted!".format(request.user))


 


