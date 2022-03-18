from django_filters import FilterSet
from .models import Reservation


class ReservationFilter(FilterSet):
    class Meta:
        model = Reservation
        fields = ['configuration', 'owner', 'status', 'active']


class MyReservationFilter(FilterSet):
    class Meta:
        model = Reservation
        fields = ['configuration', 'status', 'active']
