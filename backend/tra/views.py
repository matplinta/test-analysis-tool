from django.shortcuts import render
from rest_framework import permissions
from rest_framework import viewsets
from .models import Reservation, APIKey, Configuration, Branch, Membership
from rest_framework.response import Response
from django.contrib.auth.models import User
from .serializers  import UserSerializer




class UserViewSet(viewsets.ViewSet):
    """
    A simple ViewSet for listing or retrieving users.
    """
    def list(self, request):
        queryset = User.objects.all()
        serializer = UserSerializer(queryset, many=True)
        return Response(serializer.data)
