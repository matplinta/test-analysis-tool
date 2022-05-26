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
    path('disp_filterset/<int:filterset_id>', views.ListFiltersWithFilterSetView.as_view(), name="stats"),
    path('fail_barchart', views.GetChartForFailAnalysis.as_view(), name="failbarchart"),
    # fail_barchart
    #   PARAMS:
    #       - filterset    [REQUIRED]   Id of filterset
    #       - date_middle  [OPTIONAL]   Separation date (e.g. 2022-12-03)
    #       - date_start   [OPTIONAL]   Start date (e.g. 2022-12-03) to filter against; must be used with date_end
    #       - date_end     [OPTIONAL]   End date (e.g. 2022-12-03) to filter against;  must be used with date_start

    path('fail_barchart_subs_regfilters', views.GetFailChartForUsersAllSubscribedRegFilters.as_view(), name="failbarchart_subs_regfilters"),
    # fail_barchart_subs_regfilters
    #   PARAMS:
    #       - limit                    [OPTIONAL]   Limit to data collection from RP
    #       - fail_message_type_groups [OPTIONAL]   Ids of fail_message_type_groups, separated by commas;
    #                                               Ommiting this setting will greatly impact visualization of generated chart!
    #       - date_middle              [OPTIONAL]   Separation date (e.g. 2022-12-03)
    #       - date_start               [OPTIONAL]   Start date (e.g. 2022-12-03) to filter against; must be used with date_end
    #       - date_end                 [OPTIONAL]   End date (e.g. 2022-12-03) to filter against;  must be used with date_start
]
