from django.conf import settings
from django.db import models
from django.contrib.auth.models import User



class LabLocation(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=100, blank=False, unique=True)

    def __str__(self):
        return self.name

class Laboratory(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=50, blank=False)
    lab_location = models.ForeignKey(LabLocation, on_delete=models.CASCADE, blank=False)
    
    class Meta:
        constraints = [models.UniqueConstraint(fields=["name", "lab_location"], name='name_labloc_uniq')]

    def __str__(self):
        return self.name


class Rack(models.Model):
    name = models.CharField(max_length=50, blank=False, unique=True)
    laboratory = models.ForeignKey(Laboratory, on_delete=models.CASCADE, blank=False)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["name", "laboratory"], name='name_lab_uniq')]

    def __str__(self):
        return self.name

class Testline(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=30, blank=False, unique=True)
    maintainer = models.ForeignKey(User, on_delete=models.CASCADE)
    rack = models.ForeignKey(Rack, on_delete=models.CASCADE, blank=False, null=True)

    def __str__(self):
        return self.name

class Hardware(models.Model):
    def __str__(self):
        return self.name
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=30, blank=False, unique=True)


class OneLabReservation(models.Model):
    def __str__(self):
        return str(self.id)
    id = models.BigAutoField(primary_key=True)
    one_lab_status = models.CharField(max_length=30)


class PowerDistributionUnit(models.Model):
    def __str__(self):
        return self.name
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=30, blank=False, unique=True)
    ip = models.CharField(max_length=60, blank=False, unique=True)
    rack = models.ForeignKey(Rack, on_delete=models.CASCADE, blank=True, null=True)


class PowerDistributionUnitPort(models.Model):
    def __str__(self):
        return self.power_distribution_unit.name + " " + self.port
    power_distribution_unit = models.ForeignKey(PowerDistributionUnit, on_delete=models.CASCADE, blank=False)
    port = models.CharField(max_length=30, blank=False, unique=True)
    status = models.CharField(max_length=30, blank=True)

    class Meta:
        unique_together = ('power_distribution_unit', 'port')


class Unit(models.Model):
    def __str__(self):
        return self.name
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=30, blank=False, unique=True)
    test_line = models.ForeignKey(Testline, on_delete=models.SET_NULL, blank=True, null=True)
    hard_ware_type = models.ForeignKey(Hardware, on_delete=models.SET_NULL, blank=False, null=True)
    serial_number = models.CharField(max_length=30, blank=False, unique=True)
    version = models.CharField(max_length=10, blank=True, null=True, unique=True)
    one_lab_reservation = models.OneToOneField(OneLabReservation, on_delete=models.SET_NULL, blank=True, unique=True, null=True)
    power_distribution_unit_port = models.OneToOneField(PowerDistributionUnitPort,
                                                        on_delete=models.CASCADE,
                                                        blank=True,
                                                        unique=True,
                                                        null=True)


class Switch(models.Model):
    def __str__(self):
        return self.name
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=60, blank=False, unique=True)
    rack = models.ForeignKey(Rack, on_delete=models.CASCADE, blank=False)
    ip = models.CharField(max_length=60, blank=False, unique=True)


class UnitPort(models.Model):
    def __str__(self):
        return self.unit.name + ' ' + self.port_name

    id = models.BigAutoField(primary_key=True)
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, blank=False, unique=False)
    port_name = models.CharField(max_length=30, blank=False, unique=False)


class SwitchPort(models.Model):
    def __str__(self):
        return self.switch.name + ' ' + self.port_name

    id = models.BigAutoField(primary_key=True)
    switch = models.ForeignKey(Switch, on_delete=models.CASCADE, blank=False, unique=False)
    port_name = models.CharField(max_length=30, blank=False, unique=False)
    status = models.CharField(max_length=30, blank=True, unique=False)
    trunk_mode = models.BooleanField(null=True)


class UnitsPortSwitchPort(models.Model):
    id = models.BigAutoField(primary_key=True)
    unit_port = models.OneToOneField(UnitPort, on_delete=models.CASCADE, blank=False, unique=True)
    switch_port = models.OneToOneField(SwitchPort, on_delete=models.CASCADE, blank=False, unique=True)


class UnitPortUnitPort(models.Model):
    id = models.BigAutoField(primary_key=True)
    port1 = models.OneToOneField(UnitPort, on_delete=models.CASCADE, blank=False, unique=True, related_name='port1')
    port2 = models.OneToOneField(UnitPort, on_delete=models.CASCADE, blank=False, unique=True, related_name='port2')


class Vlan(models.Model):
    switch_port = models.ForeignKey(SwitchPort, on_delete=models.CASCADE, blank=False)
    vlan_name = models.CharField(max_length=30, blank=False, unique=False)

    class Meta:
        unique_together = ('switch_port', 'vlan_name')


class Topology(models.Model):
    def __str__(self):
        return self.name
    name = models.CharField(max_length=50, blank=False, unique=True)
    ute_cloud_supported = models.BooleanField(default=False)


class TestlineTopology(models.Model):
    testline = models.ForeignKey(TestLine, on_delete=models.CASCADE, blank=False, unique=False)
    topology = models.ForeignKey(Topology, on_delete=models.CASCADE, blank=False, unique=False)

    class Meta:
        unique_together = ('testline', 'topology')


class Server(models.Model):
    name = models.CharField(max_length=40, blank=False, unique=True)
    vnc = models.CharField(max_length=40, blank=True, unique=True)


class VirtualMachine(models.Model):
    name = models.CharField(max_length=40, blank=False, unique=True)
    address = models.CharField(max_length=40, blank=False, unique=True)
    server = models.ForeignKey(Server, on_delete=models.CASCADE, blank=False, unique=False)
    cpu = models.CharField(max_length=10, blank=True, unique=False)
    RAM = models.CharField(max_length=10, blank=True, unique=False)
