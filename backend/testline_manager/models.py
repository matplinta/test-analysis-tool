from django.conf import settings
from django.db import models
from django.contrib.auth.models import User
from polymorphic.models import PolymorphicModel


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
        verbose_name_plural = 'Laboratories'
    def __str__(self):
        return self.name


class Rack(models.Model):
    name = models.CharField(max_length=50, blank=False, unique=True)
    laboratory = models.ForeignKey(Laboratory, on_delete=models.CASCADE, blank=False)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["name", "laboratory"], name='name_lab_uniq')]

    def __str__(self):
        return self.name


class VirtualMachine(models.Model):
    name = models.CharField(max_length=100, blank=False, unique=True)
    address = models.CharField(max_length=100, blank=False, unique=True)
    cpu = models.CharField(max_length=10, blank=True)
    ram = models.CharField(max_length=10, blank=True)

    def __str__(self):
        return self.name


class Topology(models.Model):
    name = models.CharField(max_length=100, blank=False, unique=True)
    ute_cloud_supported = models.BooleanField(default=False)
    
    class Meta:
        verbose_name_plural = 'Topologies'

    def __str__(self):
        return self.name


class Testline(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=100, blank=False, unique=True)
    maintainer = models.ForeignKey(User, on_delete=models.CASCADE)
    virtual_machine = models.ForeignKey(VirtualMachine, on_delete=models.CASCADE)
    rack = models.ForeignKey(Rack, on_delete=models.CASCADE, blank=False, null=True, related_name="testlines")
    topologies = models.ManyToManyField(Topology)
    vnc = models.CharField(max_length=40, blank=True, unique=True)

    def __str__(self):
        return self.name

class HardwareType(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=30, blank=False, unique=True)

    def __str__(self):
        return self.name

class OneLabReservation(models.Model):
    id = models.BigAutoField(primary_key=True)
    one_lab_status = models.CharField(max_length=30)

    def __str__(self):
        return str(self.id)

class PowerDistributionUnit(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=30, blank=False, unique=True)
    address = models.CharField(max_length=60, blank=False, unique=True)
    rack = models.ForeignKey(Rack, on_delete=models.CASCADE, blank=True, null=True, related_name="pdus")

    def __str__(self):
        return self.name


class PowerDistributionUnitPort(models.Model):
    pdu = models.ForeignKey(PowerDistributionUnit, on_delete=models.CASCADE, blank=False, related_name="ports")
    name = models.CharField(max_length=30, blank=False, unique=True)
    status = models.CharField(max_length=30, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["pdu", "name"], name='pdu_name_uniq')]

    def __str__(self):
        return f"{self.pdu.name} {self.name}"


class Unit(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=30, blank=False, unique=True)
    testline = models.ForeignKey(Testline, on_delete=models.SET_NULL, blank=True, null=True, related_name="units")
    hardware_type = models.ForeignKey(HardwareType, on_delete=models.SET_NULL, blank=False, null=True)
    serial_number = models.CharField(max_length=30, blank=False, unique=True)
    version = models.CharField(max_length=10, blank=True, null=True, unique=True)
    one_lab_reservation = models.OneToOneField(OneLabReservation, on_delete=models.SET_NULL, blank=True, unique=True, null=True)
    pdu_port = models.OneToOneField(PowerDistributionUnitPort,
                                                        on_delete=models.CASCADE,
                                                        blank=True,
                                                        null=True)
    def __str__(self):
        return self.name


class Switch(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=60, blank=False, unique=True)
    rack = models.ForeignKey(Rack, on_delete=models.CASCADE, blank=False, related_name="switches")
    address = models.CharField(max_length=60, blank=False, unique=True)

    class Meta:
        verbose_name_plural = 'Switches'

    def __str__(self):
        return self.name


class Port(PolymorphicModel):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=100, blank=False, unique=False)
    # connected_to = models.OneToOneField("Port", on_delete=models.CASCADE, blank=True, null=True, related_name="unit_port")


class UnitPort(Port):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, blank=False, unique=False, related_name="ports")
    connected_to = models.OneToOneField(Port, on_delete=models.CASCADE, blank=True, null=True, unique=True, related_name="unit_port")

    def __str__(self):
        return f"Unit: {self.unit.name} - Port: {self.name}"


class SwitchPort(Port):
    status = models.CharField(max_length=30, blank=True, unique=False)
    trunk_mode = models.BooleanField(null=True)
    switch = models.ForeignKey(Switch, on_delete=models.CASCADE, blank=False, unique=False, related_name="ports")
    connected_to = models.OneToOneField(Port, on_delete=models.CASCADE, blank=True, null=True, unique=True, related_name="switch_port")

    def __str__(self):
        return f"Switch: {self.switch.name} - Port: {self.name}"

# class UnitsPortSwitchPort(models.Model):
#     id = models.BigAutoField(primary_key=True)
#     unit_port = models.OneToOneField(UnitPort, on_delete=models.CASCADE, blank=False)
#     switch_port = models.OneToOneField(SwitchPort, on_delete=models.CASCADE, blank=False, unique=True)


# class UnitPortUnitPort(models.Model):
#     id = models.BigAutoField(primary_key=True)
#     port1 = models.OneToOneField(UnitPort, on_delete=models.CASCADE, blank=False, unique=True, related_name='port1')
#     port2 = models.OneToOneField(UnitPort, on_delete=models.CASCADE, blank=False, unique=True, related_name='port2')


class Vlan(models.Model):
    name = models.CharField(max_length=30, blank=False, unique=False)
    switch_port = models.ForeignKey(SwitchPort, on_delete=models.CASCADE, blank=False, related_name="vlans")

    class Meta:
        constraints = [models.UniqueConstraint(fields=["switch_port", "name"], name='switch_port_vlan_uniq')]


