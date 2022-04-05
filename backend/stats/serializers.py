from .models import *
from rest_framework import serializers


class FilterSerializer(serializers.ModelSerializer):
    filter_set = serializers.CharField(source="filter_set.name")
    field = serializers.CharField(source="field.name")

    class Meta:
        model = Filter
        fields = ('id', 'value', 'filter_set', 'field')