from rest_framework import permissions


class IsAuthorOfRelatedObject(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.filter_set.author == request.user
