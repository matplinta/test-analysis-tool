from django.shortcuts import render
from rest_framework import permissions, authentication
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from django.views.generic import ListView
from rest_framework import generics

# from .models import Reservation, APIKey, Configuration, Branch, Membership
# from rest_framework.response import Response
# from django.contrib.auth.models import User
from dj_rest_auth.views import LoginView, LogoutView
from rest_framework.settings import api_settings

from .serializers import TestRunSerializer, TestsFilterSerializer
from .models import TestRun, TestsFilter


class AccessingRestrictedDataError(Exception):
    pass

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



class TestRunView(viewsets.ModelViewSet):
    serializer_class = TestRunSerializer
    queryset = TestRun.objects.all()


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
