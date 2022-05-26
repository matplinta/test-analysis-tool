from django.shortcuts import render
from django.views.generic import View
from .models import TestLine, Unit, UnitsPortSwitchPort, UnitPortUnitPort
from django.db.models import Q

# Create your views here.


def base_template(request):
    return render(request, 'testline_menager/home.html', {})


class TestlineView(View):
    def get(self, request, testline_id):


        location = get_testline_location(testline_id=testline_id)
        testline_main_info = get_testline_main_info(testline_id=testline_id)
        units_info, connections = get_units_information_and_connections(testline_id=testline_id)
  

        return render(request,
                      'testline_menager/testline_view.html',
                      {
                          'connections': connections,
                           'units_info': units_info,
                           'testline_main_info': testline_main_info,
                           'location': location
                      }
                      )


def get_testline_main_info(testline_id):
    test_line = TestLine.objects.get(pk=testline_id)
    test_line_main_information = {}
    test_line_main_information['name'] = test_line.name
    test_line_main_information['maintainer'] = test_line.maintainer.username
    return test_line_main_information


def get_testline_location(testline_id):
    test_line = TestLine.objects.get(pk=testline_id)
    location = {}
    location['location'] = test_line.rack.laboratory.lab_location.name
    location['lab'] = test_line.rack.laboratory.name
    location['rack'] = test_line.rack.name
    return location


def get_units_information_and_connections(testline_id):
    units_info = []
    connections = {}
    connections['switch'] = {}
    connections['unit'] =  {}

    units = Unit.objects.filter(test_line=testline_id)

    for unit in units:
        unit_name = unit.name
        units_info.append(get_unit_information(unit))
        connections['switch'][unit_name], connections['unit'][unit.name] = get_unit_connections(unit)
    return units_info, connections


def get_unit_information(unit):
    unit_info = {}
    unit_info['serial_number'] = unit.serial_number
    unit_info['hard_ware_type'] = unit.hard_ware_type.name
    unit_info['version'] = unit.version
    unit_info['name'] = unit.name
    unit_info['one_lab_reservation'] = unit.one_lab_reservation.one_lab_status
    if unit.power_distribution_unit_port:
        unit_info['PDU'] = {}
        unit_info['PDU']['port'] = unit.power_distribution_unit_port.port
        unit_info['PDU']['status'] = unit.power_distribution_unit_port.status
        unit_info['PDU']['name'] = unit.power_distribution_unit_port.power_distribution_unit.name
        unit_info['PDU']['ip'] = unit.power_distribution_unit_port.power_distribution_unit.ip

    return unit_info


def get_unit_connections(unit):
    switch_connections = get_unit_to_switch_connections(unit_id=unit.id)
    unit_connections = get_unit_to_unit_connections(unit_id=unit.id)

    return switch_connections, unit_connections

def get_unit_to_switch_connections(unit_id):
    switch_connections = UnitsPortSwitchPort.objects.filter(unit_port__unit__id=unit_id)
    connections = {}
    for switch_connection in switch_connections:
        unit_port = switch_connection.unit_port.port_name
        connections[unit_port] = {}
        connections[unit_port]['connection_id'] = switch_connection.id
        connections[unit_port]['switch'] = switch_connection.switch_port.switch.name
        connections[unit_port]['port_name'] = switch_connection.switch_port.port_name
        connections[unit_port]['trunk'] = switch_connection.switch_port.trunk_mode
        connections[unit_port]['status'] = switch_connection.switch_port.status

    return connections


def get_unit_to_unit_connections(unit_id):
    unit_connections = UnitPortUnitPort.objects.filter(Q(port1__unit__id=unit_id) | Q(port2__unit__id=unit_id))
    connections = {}

    for unit_connection in unit_connections:
        if unit_connection.port1.unit.id == unit_id:
            connections[unit_connection.port1.port_name] = {}
            connections[unit_connection.port1.port_name]['unit_name'] = unit_connection.port2.unit.name
            connections[unit_connection.port1.port_name]['port_name'] = unit_connection.port2.port_name
            connections[unit_connection.port1.port_name]['connection_id'] = unit_connection.id
        if unit_connection.port2.unit.id == unit_id:
            connections[unit_connection.port2.port_name] = {}
            connections[unit_connection.port2.port_name]['unit_name'] = unit_connection.port1.unit.name
            connections[unit_connection.port2.port_name]['port_name'] = unit_connection.port1.port_name
            connections[unit_connection.port2.port_name]['connection_id'] = unit_connection.id


    return connections

