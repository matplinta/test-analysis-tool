from rest_framework import viewsets
from django.contrib.auth.models import User
from .serializers import UserSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from dj_rest_auth.views import LogoutView
from rest_framework import authentication
from rest_framework.permissions import IsAuthenticated


class UsersList(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSerializer
    queryset = User.objects.all()
    pagination_class = None

    @action(detail=False, url_path="me")
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class LogoutViewOverride(LogoutView):
    authentication_classes = (authentication.TokenAuthentication, authentication.SessionAuthentication)
    permission_classes = (IsAuthenticated,)  