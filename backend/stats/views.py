from django.shortcuts import render

from .models import * 
from rep_portal.api import RepPortal
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import json
from .serializers import FilterSerializer


class FilterPresetView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)   
    serializer_class = FilterSerializer

    def get_queryset(self):
        filterset_id = self.kwargs['filterset_id']
        filter_set = FilterSet.objects.get(pk=filterset_id)
        queryset = Filter.objects.all()
        return queryset.filter(filter_set=filter_set)
