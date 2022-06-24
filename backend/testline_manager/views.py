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


class LabLocationView(viewsets.ModelViewSet):
    serializer_class = LabLocationSerializer
    queryset = LabLocation.objects.all()
    pagination_class = None


class TeamView(viewsets.ModelViewSet):
    serializer_class = TeamSerializer
    queryset = Team.objects.all()
    pagination_class = None


class LabKeeperView(viewsets.ModelViewSet):
    serializer_class = LabKeeperSerializer
    queryset = LabKeeper.objects.all()
    pagination_class = None


class LaboratoryView(viewsets.ModelViewSet):
    serializer_class = LaboratorySerializer
    queryset = Laboratory.objects.all()
    pagination_class = None


class RackView(viewsets.ModelViewSet):
    serializer_class = RackSerializer
    queryset = Rack.objects.all()


class VirtualMachineView(viewsets.ModelViewSet):
    serializer_class = VirtualMachineSerializer
    queryset = VirtualMachine.objects.all()


class TopologyView(viewsets.ModelViewSet):
    serializer_class = TopologySerializer
    queryset = Topology.objects.all()
    pagination_class = None


class TestlineView(viewsets.ModelViewSet):
    serializer_class = TestlineSerializer
    queryset = Testline.objects.all()


class HardwareTypeView(viewsets.ModelViewSet):
    serializer_class = HardwareTypeSerializer
    queryset = HardwareType.objects.all()
    pagination_class = None


class OneLabReservationView(viewsets.ModelViewSet):
    serializer_class = OneLabReservationSerializer
    queryset = OneLabReservation.objects.all()


class PowerDistributionUnitView(viewsets.ModelViewSet):
    serializer_class = PowerDistributionUnitSerializer
    queryset = PowerDistributionUnit.objects.all()

    @action(detail=True, methods=['get'])
    def ports(self, request, pk=None):
        pdu = self.get_object()
        pdu_ports = PowerDistributionUnitPort.objects.filter(pdu=pdu)
        serializer = PowerDistributionUnitPortSerializer(pdu_ports, many=True)
        return Response(serializer.data)


class PowerDistributionUnitPortView(viewsets.ModelViewSet):
    serializer_class = PowerDistributionUnitPortSerializer
    queryset = PowerDistributionUnitPort.objects.all()


class UnitView(viewsets.ModelViewSet):
    serializer_class = UnitSerializer
    queryset = Unit.objects.all()

    @action(detail=True, methods=['get'])
    def ports(self, request, pk=None):
        unit = self.get_object()
        unit_ports = UnitPort.objects.filter(unit=unit)
        serializer = CustomUnitPortSerializer(unit_ports, many=True)
        return Response(serializer.data)


class SwitchView(viewsets.ModelViewSet):
    serializer_class = SwitchSerializer
    queryset = Switch.objects.all()

    @action(detail=True, methods=['get'])
    def ports(self, request, pk=None):
        switch = self.get_object()
        switch_ports = SwitchPort.objects.filter(switch=switch)
        serializer = SwitchPortOmitSwitchSerializer(switch_ports, many=True)
        return Response(serializer.data)


class UnitPortView(viewsets.ModelViewSet):
    serializer_class = UnitPortSerializer
    queryset = UnitPort.objects.all()


class SwitchPortView(viewsets.ModelViewSet):
    serializer_class = SwitchPortSerializer
    queryset = SwitchPort.objects.all()


class VlanView(viewsets.ModelViewSet):
    serializer_class = VlanSerializer
    queryset = Vlan.objects.all()


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

