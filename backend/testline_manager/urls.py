from django.urls import path, include
from .views import *
from rest_framework import routers

router = routers.DefaultRouter()
router.register(r'lablocation', LabLocationView)
router.register(r'team', TeamView)
router.register(r'labkeeper', LabKeeperView)
router.register(r'laboratory', LaboratoryView)
router.register(r'rack', RackView)
router.register(r'virtual_machine', VirtualMachineView)
router.register(r'topology', TopologyView)
router.register(r'testline', TestlineView)
router.register(r'hardware_type', HardwareTypeView)
router.register(r'onelab_reservation', OneLabReservationView)
router.register(r'pdu', PowerDistributionUnitView)
router.register(r'pdu_port', PowerDistributionUnitPortView)
router.register(r'unit', UnitView)
router.register(r'unit_port', UnitPortView)
router.register(r'switch', SwitchView)
router.register(r'switch_port', SwitchPortView)
router.register(r'vlan', VlanView)

urlpatterns = [
    path('', include(router.urls)),
    # path('ports', UnitPortsView.as_view(), name="unitportsview"),

]