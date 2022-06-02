from django.contrib import admin
from .models import *
from polymorphic.admin import PolymorphicParentModelAdmin, PolymorphicChildModelAdmin


@admin.register(LabLocation)
class LabLocationAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    list_filter = ['name']
    search_fields = ['name']


@admin.register(Laboratory)
class LaboratoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'lab_location']
    list_filter = ['name', 'lab_location']
    search_fields = ['name', 'lab_location']


@admin.register(Rack)
class RackAdmin(admin.ModelAdmin):
    list_display = ['name', 'laboratory']
    list_filter = ['name', 'laboratory']
    search_fields = ['name', 'laboratory']


@admin.register(Testline)
class TestlineAdmin(admin.ModelAdmin):
    list_display = ['name', 'maintainer', 'rack', 'virtual_machine', 'vnc']
    list_filter = ['name', 'maintainer', 'rack']
    search_fields = ['name', 'maintainer', 'rack']


@admin.register(HardwareType)
class HardwareTypeAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    list_filter = ['id', 'name']
    search_fields = ['id', 'name']


@admin.register(OneLabReservation)
class OneLabReservationAdmin(admin.ModelAdmin):
    list_display = ['id', 'one_lab_status']
    list_filter = ['id', 'one_lab_status']
    search_fields = ['id', 'one_lab_status']


@admin.register(PowerDistributionUnit)
class PowerDistributionUnitAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'address', 'rack']
    list_filter = ['id', 'name', 'address']
    search_fields = ['id', 'name', 'address']


@admin.register(PowerDistributionUnitPort)
class PowerDistributionUnitPortAdmin(admin.ModelAdmin):
    list_display = ['pdu', 'name', 'status']
    list_filter = ['pdu', 'name', 'status']
    search_fields = ['pdu', 'name', 'status']


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'testline', 'hardware_type', 'serial_number', 'one_lab_reservation', 'pdu_port', 'version']
    list_filter = ['id', 'name', 'testline', 'hardware_type', 'serial_number', 'one_lab_reservation', 'pdu_port']
    search_fields = ['id', 'name', 'testline', 'hardware_type', 'serial_number', 'one_lab_reservation', 'pdu_port']


@admin.register(Switch)
class SwitchAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'rack', 'address']
    list_filter = ['id', 'name', 'rack']
    search_fields = ['id', 'name', 'rack']


# class PortAdmin(Poly)


@admin.register(UnitPort)
class UnitPortAdmin(admin.ModelAdmin):
    list_display = ['id', 'unit', 'name', 'connected_to']
    list_filter = ['id', 'unit', 'name']
    search_fields = ['id', 'unit', 'name']


@admin.register(SwitchPort)
class SwitchPortAdmin(admin.ModelAdmin):
    list_display = ['id', 'switch', 'name', 'status', 'trunk_mode', 'connected_to']
    list_filter = ['id', 'switch', 'name', 'status', 'trunk_mode']
    search_fields = ['id', 'switch', 'name', 'status', 'trunk_mode']


# class UnitsPortSwitchPortAdmin(admin.ModelAdmin):
#     list_display = ['id', 'unit_port', 'switch_port']
#     list_filter = ['id', 'unit_port', 'switch_port']
#     search_fields = ['id', 'unit_port', 'switch_port']


# class UnitPortUnitPortAdmin(admin.ModelAdmin):
#     list_display = ['id', 'port1', 'port2']
#     list_filter = ['id', 'port1', 'port2']
#     search_fields = ['id', 'port1', 'port2']


@admin.register(Vlan)
class VlanAdmin(admin.ModelAdmin):
    list_display = ['switch_port', 'name']
    list_filter = ['switch_port', 'name']
    search_fields = ['switch_port', 'name']


@admin.register(Topology)
class TopologyAdmin(admin.ModelAdmin):
    list_display = ['name']
    list_filter = ['name']
    search_fields = ['name']


@admin.register(VirtualMachine)
class VirtualMachineAdmin(admin.ModelAdmin):
    list_display = ['name', 'address', 'cpu', 'ram']
    list_filter = ['cpu', 'ram']
    search_fields = ['name', 'address', 'cpu', 'ram']

