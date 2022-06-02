from .models import *
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')


class VirtualMachineSerializer(serializers.ModelSerializer):
    class Meta:
        model = VirtualMachine
        fields = ('id', 'name', 'address', 'cpu', 'ram')


class RackSerializer(serializers.ModelSerializer):
    laboratory = serializers.CharField(source='laboratory.name')

    class Meta:
        model = Rack
        fields = ('id', 'name', 'laboratory')


class TopologySerializer(serializers.ModelSerializer):
    class Meta:
        model = Topology
        fields = ('id', 'name', 'ute_cloud_supported')


class HardwareTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = HardwareType
        fields = ('id', 'name')


class OneLabReservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OneLabReservation
        fields = ('id', 'one_lab_status')


class PowerDistributionUnitPortSerializer(serializers.ModelSerializer):
    class Meta:
        model = PowerDistributionUnitPort
        fields = ('id', 'name', 'status')


class GenericPortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Port
        fields = ('id', 'name')


class SwitchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Switch
        fields = ('id', 'name', 'address')


class UnitPortSerializer(serializers.ModelSerializer):
    connected_to = GenericPortSerializer(read_only=True)
    class Meta:
        model = UnitPort
        fields = ('id', 'name', 'connected_to')


class SwitchPortSerializer(serializers.ModelSerializer):
    switch = SwitchSerializer()

    class Meta:
        model = SwitchPort
        fields = ('id', 'name', 'status', 'trunk_mode', 'switch')


class UnitSerializer(serializers.ModelSerializer):
    hardware_type = HardwareTypeSerializer()
    one_lab_reservation = OneLabReservationSerializer()
    pdu_port = PowerDistributionUnitPortSerializer()
    ports = UnitPortSerializer(read_only=True, many=True)

    class Meta:
        model = Unit
        fields = ('id', 'name', 'hardware_type', 'serial_number', 
                  'version', 'one_lab_reservation', 'pdu_port', 'ports')


class TestlineSerializer(serializers.ModelSerializer):
    maintainer = UserSerializer(read_only=True)
    virtual_machine = VirtualMachineSerializer()
    rack = RackSerializer()
    topologies = TopologySerializer(read_only=True, many=True)
    units = UnitSerializer(read_only=True, many=True)

    class Meta:
        model = Testline
        fields = ('id', 'name', 'maintainer', 'virtual_machine', 
                  'rack', 'topologies', 'vnc', 'units')