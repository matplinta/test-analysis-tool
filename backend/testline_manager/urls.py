from django.urls import path, include
from .views import TestlineView, UnitPortsView
from rest_framework import routers

router = routers.DefaultRouter()
router.register(r'testline', TestlineView)

urlpatterns = [
    path('', include(router.urls)),
    path('ports', UnitPortsView.as_view(), name="unitportsview"),

]