from .models import *
from rest_framework import serializers


class LabLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabLocation
        fields = ('id', 'name')


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabLocation
        fields = ('id', 'name')


class LabKeeperSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabLocation
        fields = ('id', 'name', 'team')


class LaboratorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Laboratory
        fields = ('id', 'name', 'lab_location')


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')


class VirtualMachineSerializer(serializers.ModelSerializer):
    class Meta:
        model = VirtualMachine
        fields = ('id', 'name', 'address', 'kvm', 'cpu', 'ram')


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
        fields = ('id', 'status', 'owner')


class PowerDistributionUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = PowerDistributionUnit
        fields = ('id', 'name', 'address', 'rack')


class PowerDistributionUnitPortSerializer(serializers.ModelSerializer):
    class Meta:
        model = PowerDistributionUnitPort
        fields = ('id', 'name', 'status')


class GenericPortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Port
        fields = ('id', 'name')


class SwitchSerializer(serializers.ModelSerializer):
    rack = RackSerializer()
    class Meta:
        model = Switch
        fields = ('id', 'name', 'address', 'rack')


class UnitPortSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitPort
        fields = ('id', 'name')


class CustomUnitPortSerializer(serializers.ModelSerializer):
    connected_to = GenericPortSerializer(read_only=True)
    class Meta:
        model = UnitPort
        fields = ('id', 'name', 'connected_to')

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if isinstance(instance.connected_to, UnitPort):
            serializer = UnitPortSerializer
        elif isinstance(instance.connected_to, SwitchPort):
            serializer = SwitchPortSerializer
        else:
            return ret
        connected_to_serialized = serializer(instance.connected_to).data
        ret['connected_to'] = connected_to_serialized
        return ret


class VlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vlan
        fields = ('id', 'name')


class SwitchPortSerializer(serializers.ModelSerializer):
    switch = SwitchSerializer()
    vlans = VlanSerializer(read_only=True, many=True)

    class Meta:
        model = SwitchPort
        fields = ('id', 'name', 'status', 'trunk_mode', 'switch', 'vlans')


class SwitchPortOmitSwitchSerializer(serializers.ModelSerializer):
    vlans = VlanSerializer(read_only=True, many=True)

    class Meta:
        model = SwitchPort
        fields = ('id', 'name', 'status', 'trunk_mode', 'vlans')


class UnitSerializer(serializers.ModelSerializer):
    hardware_type = HardwareTypeSerializer()
    one_lab_reservation = OneLabReservationSerializer()
    pdu_port = PowerDistributionUnitPortSerializer()
    ports = CustomUnitPortSerializer(read_only=True, many=True)

    class Meta:
        model = Unit
        fields = ('id', 'name', 'hardware_type', 'serial_number', 
                  'version', 'one_lab_reservation', 'pdu_port', 'ports')

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        new_ports = {'switch_ports': [], 'unit_ports': [], 'unconnected': []}
        for port in ret['ports']:
            if port['connected_to']:
                if 'switch' in port['connected_to'].keys():
                    new_ports['switch_ports'].append(port)
                else:
                    new_ports['unit_ports'].append(port)
            else:
                new_ports['unconnected'].append(port)
        ret['ports'] = new_ports
        return ret


class TestlineSerializer(serializers.ModelSerializer):
    maintainer = UserSerializer(read_only=True)
    virtual_machine = VirtualMachineSerializer()
    rack = RackSerializer()
    topologies = TopologySerializer(read_only=True, many=True)
    units = UnitSerializer(read_only=True, many=True)

    class Meta:
        model = Testline
        fields = ('id', 'name', 'maintainer', 'virtual_machine', 
                  'rack', 'topologies', 'vnc', 'units', 'team')