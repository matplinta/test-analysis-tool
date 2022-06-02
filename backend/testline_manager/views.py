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

from .models import *
from .serializers import *
from backend.permissions import IsAuthorOfObject
# from .permissions import IsOwnerOfObject, IsSubscribedToObject


class TestlineView(viewsets.ModelViewSet):
    serializer_class = TestlineSerializer
    queryset = Testline.objects.all()
    pagination_class = None


class UnitPortView(viewsets.ModelViewSet):
    serializer_class = UnitPortSerializer
    queryset = UnitPort.objects.all()
    pagination_class = None


class SwitchPortView(viewsets.ModelViewSet):
    serializer_class = SwitchPortSerializer
    queryset = SwitchPort.objects.all()
    pagination_class = None


# class UnitPortsView(APIView):
#     def get(self, request, unit_id=None):
#         def serialize_data_with_filters(units):
#             units_list = []
#             for unit in units:
#                 unit_serialized = UnitSerializer(unit).data
#                 ports_list = []
#                 for port in unit.ports.all():
#                     serialized_port = UnitPortSerializer(port).data
                    
#                     if isinstance(port.connected_to, UnitPort):
#                         serializer = UnitPortSerializer
#                     elif isinstance(port.connected_to, SwitchPort):
#                         serializer = SwitchPortSerializer
#                     serialized_data = serializer(port.connected_to).data
#                     serialized_port['connected_to'] = serialized_data
#                     ports_list.append(serialized_port)
#                 unit_serialized['ports'] = ports_list
#                 units_list.append(unit_serialized)
#             return units_list

#         if unit_id:
#             units = Unit.objects.filter(pk=unit_id)
#         else:
#             units = Unit.objects.all()
#         return Response(serialize_data_with_filters(units))

