from django_filters import rest_framework as filters
from django.contrib.auth.models import User
from .models import (
    FilterSet,
)

class FilterSetFilterClass(filters.FilterSet):
    name = filters.CharFilter(field_name='name', lookup_expr="icontains")
    author = filters.ModelMultipleChoiceFilter(field_name='author__username', to_field_name="username", queryset=User.objects.all())

    class Meta:
        model = FilterSet
        fields = ("name", "author")
