from django.contrib import admin
from django.urls import path, include

from rest_framework import routers
from dj_rest_auth.views import LoginView, LogoutView
from stats import views

router = routers.DefaultRouter()
router.register(r'filterset', views.FilterSetView)
router.register(r'filter', views.FilterView)


urlpatterns = [
    path('', include(router.urls)),
    path('filter_fields', views.FilterFieldView.as_view(), name="filterfields"),
    path('userfiltersets', views.UserFilterSetView.as_view(), name="userfiltersets"),
    path('disp_filterset/<int:filterset_id>', views.ListFiltersWithFilterSetView.as_view(), name="stats"),
    path('fail_barchart/<int:filterset_id>', views.GetChartForFailAnalysis.as_view(), name="failbarchart"),
]
