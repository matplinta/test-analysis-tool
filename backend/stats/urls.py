from django.contrib import admin
from django.urls import path, include

from rest_framework import routers
from dj_rest_auth.views import LoginView, LogoutView
from stats import views

router = routers.DefaultRouter()
router.register(r'filtersets_detailed', views.FilterSetDetailView, basename='filterset_detail')
router.register(r'filtersets', views.FilterSetView)
router.register(r'filters', views.FilterView)


urlpatterns = [
    path('', include(router.urls)),
    path('filter_fields', views.FilterFieldView.as_view(), name="filterfields"),
    # path('filtersets_detailed/', views.FilterSetDetailView.as_view(), name="filterset_detailed"),
    # path('filtersets_detailed/<int:filterset_id>', views.FilterSetDetailView.as_view(), name="filterset_detailed_pk"),
    # path('filters/by_filterset/<int:filterset_id>', views.ListFiltersWithFilterSetView.as_view(), name="filters_by_filterset"),
    path('fail_barchart', views.GetChartByExceptionType.as_view(), name="failbarchart"),
    path('fail_barchart/subs_regfilters', views.GetChartByExceptionTypeForAllSubscribedTestSetFilters.as_view(), name="failbarchart_subs_regfilters"),
    path('get_excel', views.GetExcelData.as_view(), name="excel_data"),
    path('get_excel/subs_regfilters', views.GetExcelDataForAllSubscribedTestSetFilters.as_view(), name="excel_data_subs_regfilters"),

]
