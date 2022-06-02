from django.urls import path, include
from .views import *
from rest_framework import routers

router = routers.DefaultRouter()
router.register(r'testline', TestlineView)
router.register(r'unitport', UnitPortView)
router.register(r'switchport', SwitchPortView)

urlpatterns = [
    path('', include(router.urls)),
    # path('ports', UnitPortsView.as_view(), name="unitportsview"),

]