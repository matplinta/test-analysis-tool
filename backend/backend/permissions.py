from rest_framework import permissions


class IsAuthorOfObject(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.author == request.user

class IsUserOfObject(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user