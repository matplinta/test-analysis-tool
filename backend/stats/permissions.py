from rest_framework import permissions


class IsAuthorOfRelatedObject(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.filter_set.author == request.user

class IsAuthorOfFilterSetOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user
