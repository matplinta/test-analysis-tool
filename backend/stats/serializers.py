from .models import *
from rest_framework import serializers


class FilterSerializerListOnly(serializers.ModelSerializer):
    field = serializers.CharField(source="field.name")

    class Meta:
        model = Filter
        fields = ('field', 'value')


class FilterSerializer(serializers.ModelSerializer):
    filter_set = serializers.CharField(source="filter_set.name")
    field = serializers.CharField(source="field.name")

    class Meta:
        model = Filter
        fields = ('id', 'value', 'filter_set', 'field')

    def validate_filter_set(self, value):
        try: 
            fs = FilterSet.objects.get(name=value)
        except FilterSet.DoesNotExist:
            raise serializers.ValidationError(f"Specified FilterSet: {value} does not exist")
        return value

    def validate_field(self, value):
        try: 
            fs = FilterField.objects.get(name=value)
        except FilterField.DoesNotExist:
            raise serializers.ValidationError(f"Specified FilterField: {value} does not exist")
        return value

    def create(self, validated_data):
        filter_set_data = validated_data.pop('filter_set')
        filter_set_instance = FilterSet.objects.get(**filter_set_data)
        field_data = validated_data.pop('field')
        field_instance = FilterField.objects.get(**field_data)
        filter_instance = Filter.objects.create(filter_set=filter_set_instance, field=field_instance, **validated_data)
        return filter_instance


    def update(self, instance, validated_data):
        filter_set_data = validated_data.pop('filter_set')
        filter_set_instance = FilterSet.objects.get(**filter_set_data)
        field_data = validated_data.pop('field')
        field_instance = FilterField.objects.get(**field_data)
        instance.filter_set = filter_set_instance
        instance.field = field_instance
        instance.value = validated_data.get('value', instance.value)
        instance.save()
        return instance



class FilterSetSerializer(serializers.ModelSerializer):
    author = serializers.CharField(read_only=True, default=serializers.CurrentUserDefault())
    class Meta:
        model = FilterSet
        fields = ('id', 'name', 'author')
        read_only_fields = ('author',)


class FilterFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = FilterSet
        fields = ('id', 'name',)
