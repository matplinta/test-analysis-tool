from rest_framework import permissions


class IsOwnerOfObject(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user in obj.owners.all()


class IsSubscribedToObject(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user in obj.subscribers.all()