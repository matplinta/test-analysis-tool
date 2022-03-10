from django.urls import include, path
from rest_framework import routers

from .views import ActiveReservationViewSet, ReservationViewSet, APIKeyViewSet, base_template, ShowReservationsView, \
    ShowMyReservationsView, AddBranch, EditApiTokenView, AddConfiguration, ShowCreateReservationsView, \
    EditReservation, DeleteReservationView


router = routers.DefaultRouter()
router.register(r'active_reservations', ActiveReservationViewSet)
router.register(r'reservations', ReservationViewSet)
router.register(r'api_key', APIKeyViewSet)

# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.
urlpatterns = [
    path('', base_template, name="scheduler"),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('reservations/', ShowReservationsView.as_view(), name="reservations"),
    path('my-reservations/', ShowMyReservationsView.as_view(), name="my-reservations"),
    path('my-reservations/update/<int:pk>/', ShowMyReservationsView.as_view(), name="reservation-update"),
    path('my-reservations/delete/', DeleteReservationView.as_view(), name="reservation-delete"),
    path('create-reservations/', ShowCreateReservationsView.as_view(), name="create-reservations"),
    path('edit_api_token/', EditApiTokenView.as_view(), name="edit_api_key"),
    path('add_configuration/', AddConfiguration.as_view(), name="add_configuration"),
    path('add_branch/', AddBranch.as_view(), name="add_branch"),
    path('my-reservations/', ShowMyReservationsView.as_view(), name="my-reservations"),
    path('my-reservation/<int:reservation_id>/edit/', EditReservation.as_view(), name="update-reservations")
]
