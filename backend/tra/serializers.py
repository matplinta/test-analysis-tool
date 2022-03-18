from .models import Reservation, APIKey
from rest_framework import serializers
from django.contrib.auth.models import User



class UserSerializer(serializers.ModelSerializer):
    snippets = serializers.PrimaryKeyRelatedField(many=True, queryset=Snippet.objects.all())
    class Meta:
        model = User
# class ReservationSerializer(serializers.ModelSerializer):
#     configuration_name = serializers.CharField(source='configuration.name')

#     branch = serializers.CharField(source='branch.name')
#     owner_username = serializers.CharField(source='owner.username')
#     owner_email = serializers.CharField(source='owner.email')


#     class Meta:
#         model = Reservation
#         fields = ['id', 'owner_username', 'active', 'counter', 'configuration_name', 'start_time', 'end_time', 'status',
#                   'ute_reservation_id', 'user', 'password', 'days', 'address', 'branch', 'owner_email', 'build'
#                   ]


#     def update(self, instance, validated_data):
#         old_status = instance.status
#         instance.counter = validated_data.get('counter', instance.counter)
#         instance.status = validated_data.get('status', instance.status)
#         if instance.status != old_status and instance.status == 'Confirmed' and instance.counter > 0:
#             instance.counter = instance.counter - 1

#         instance.ute_reservation_id = validated_data.get('ute_reservation_id', instance.ute_reservation_id)
#         instance.user = validated_data.get('user', instance.user)
#         instance.password = validated_data.get('password', instance.password)
#         instance.address = validated_data.get('address', instance.address)

#         if instance.password == "":
#             instance.password = None
#         if instance.user == "":
#             instance.user = None
#         if instance.address == "":
#             instance.address = None
#         if instance.status == "":
#             instance.status = None
#         if instance.status == "":
#             instance.status = None

#         instance.save()
#         return instance


# class APIKeySerializer(serializers.ModelSerializer):
#     user = serializers.CharField(source='user.username')

#     class Meta:
#         model = APIKey
#         fields = ['user', 'key']


