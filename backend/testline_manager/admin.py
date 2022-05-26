from django.contrib import admin
from .models import *


class LabLocationAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    list_filter = ['name']
    search_fields = ['name']


class LaboratoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'lab_location']
    list_filter = ['name', 'lab_location']
    search_fields = ['name', 'lab_location']


class RackAdmin(admin.ModelAdmin):
    list_display = ['name', 'laboratory']
    list_filter = ['name', 'laboratory']
    search_fields = ['name', 'laboratory']


class TestLineAdmin(admin.ModelAdmin):
    list_display = ['name', 'maintainer', 'rack']
    list_filter = ['name', 'maintainer', 'rack']
    search_fields = ['name', 'maintainer', 'rack']


class HardWareAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    list_filter = ['id', 'name']
    search_fields = ['id', 'name']


class OneLabReservationAdmin(admin.ModelAdmin):
    list_display = ['id', 'one_lab_status']
    list_filter = ['id', 'one_lab_status']
    search_fields = ['id', 'one_lab_status']


class PowerDistributionUnitAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'ip']
    list_filter = ['id', 'name', 'ip']
    search_fields = ['id', 'name', 'ip']


class PowerDistributionUnitPortAdmin(admin.ModelAdmin):
    list_display = ['power_distribution_unit', 'port', 'status']
    list_filter = ['power_distribution_unit', 'port', 'status']
    search_fields = ['power_distribution_unit', 'port', 'status']


class UnitAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'test_line', 'hard_ware_type', 'serial_number', 'one_lab_reservation', 'power_distribution_unit_port']
    list_filter = ['id', 'name', 'test_line', 'hard_ware_type', 'serial_number', 'one_lab_reservation', 'power_distribution_unit_port']
    search_fields = ['id', 'name', 'test_line', 'hard_ware_type', 'serial_number', 'one_lab_reservation', 'power_distribution_unit_port']


class SwitchAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'rack']
    list_filter = ['id', 'name', 'rack']
    search_fields = ['id', 'name', 'rack']


class UnitPortAdmin(admin.ModelAdmin):
    list_display = ['id', 'unit', 'port_name']
    list_filter = ['id', 'unit', 'port_name']
    search_fields = ['id', 'unit', 'port_name']


class SwitchPortAdmin(admin.ModelAdmin):
    list_display = ['id', 'switch', 'port_name', 'status', 'trunk_mode']
    list_filter = ['id', 'switch', 'port_name', 'status', 'trunk_mode']
    search_fields = ['id', 'switch', 'port_name', 'status', 'trunk_mode']


class UnitsPortSwitchPortAdmin(admin.ModelAdmin):
    list_display = ['id', 'unit_port', 'switch_port']
    list_filter = ['id', 'unit_port', 'switch_port']
    search_fields = ['id', 'unit_port', 'switch_port']


class UnitPortUnitPortAdmin(admin.ModelAdmin):
    list_display = ['id', 'port1', 'port2']
    list_filter = ['id', 'port1', 'port2']
    search_fields = ['id', 'port1', 'port2']


class VlanAdmin(admin.ModelAdmin):
    list_display = ['switch_port', 'vlan_name']
    list_filter = ['switch_port', 'vlan_name']
    search_fields = ['switch_port', 'vlan_name']


class TopologyAdmin(admin.ModelAdmin):
    list_display = ['name']
    list_filter = ['name']
    search_fields = ['name']


class TestlineTopologyAdmin(admin.ModelAdmin):
    list_display = ['testline', 'topology']
    list_filter = ['testline', 'topology']
    search_fields = ['testline', 'topology']


class ServerAdmin(admin.ModelAdmin):
    list_display = ['name', 'vnc']
    list_filter = ['name', 'vnc']
    search_fields = ['name', 'vnc']


class VirtualMachineAdmin(admin.ModelAdmin):
    list_display = ['name', 'address', 'server', 'cpu', 'RAM']
    list_filter = ['server', 'cpu', 'RAM']
    search_fields = ['name', 'address', 'server', 'cpu', 'RAM']


admin.site.register(Server, ServerAdmin)
admin.site.register(VirtualMachine, VirtualMachineAdmin)
admin.site.register(Laboratory, LaboratoryAdmin)
admin.site.register(Rack, RackAdmin)
admin.site.register(TestLine, TestLineAdmin)
admin.site.register(HardWare, HardWareAdmin)
admin.site.register(OneLabReservation, OneLabReservationAdmin)
admin.site.register(PowerDistributionUnit, PowerDistributionUnitAdmin)
admin.site.register(PowerDistributionUnitPort, PowerDistributionUnitPortAdmin)
admin.site.register(Switch, SwitchAdmin)
admin.site.register(Unit, UnitAdmin)
admin.site.register(UnitPort, UnitPortAdmin)
admin.site.register(SwitchPort, SwitchPortAdmin)
admin.site.register(UnitsPortSwitchPort, UnitsPortSwitchPortAdmin)
admin.site.register(UnitPortUnitPort, UnitPortUnitPortAdmin)
admin.site.register(Vlan, VlanAdmin)
admin.site.register(Topology, TopologyAdmin)
admin.site.register(TestlineTopology, TestlineTopologyAdmin)
