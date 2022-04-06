from django.shortcuts import render

from rep_portal.api import RepPortal
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets
from .serializers import FilterSerializer, FilterSetSerializer, FilterFieldSerializer, FilterSerializerListOnly

from stats.models import * 
from tra.models import FailMessageType
from rep_portal.analyzer import Analyzer


class ListFiltersWithFilterSetView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)   
    serializer_class = FilterSerializerListOnly

    def get_queryset(self):
        filterset_id = self.kwargs['filterset_id']
        filter_set = FilterSet.objects.get(pk=filterset_id)
        queryset = Filter.objects.all()
        return queryset.filter(filter_set=filter_set)


class GetChartForFailAnalysis(APIView):
    # authentication_classes = (authentication.TokenAuthentication,)
    permission_classes = (IsAuthenticated,)   
    
    def get(self, request, filterset_id):
        filter_set = FilterSet.objects.get(pk=filterset_id)
        filters = Filter.objects.filter(filter_set=filter_set)
        fail_message_types = FailMessageType.objects.filter(user=self.request.user)
        analyzer = Analyzer(fail_message_types, filters)
        data = analyzer.plot_runs_by_exception_types()
        return Response(data)



class FilterSetView(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)   
    serializer_class = FilterSetSerializer
    queryset = FilterSet.objects.all()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class UserFilterSetView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = FilterSetSerializer

    def get_queryset(self):
        return FilterSet.objects.all().filter(author=self.request.user)


class FilterView(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)   
    serializer_class = FilterSerializer
    queryset = Filter.objects.all()


class FilterFieldView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)   
    serializer_class = FilterFieldSerializer
    queryset = FilterField.objects.all()