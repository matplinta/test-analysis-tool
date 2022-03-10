from django.contrib import admin
from .models import Configuration, Reservation, APIKey, Branch, Team, Membership


class ConfigurationAdmin(admin.ModelAdmin):
    list_display = ['name']
    list_filter = ['name']
    search_fields = ['name']


class APIKeyAdmin(admin.ModelAdmin):
    list_display = ['user', 'key']
    search_fields = ['user']


class BranchAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']


class BuildAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']


class TeamAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']


class MembershipAdmin(admin.ModelAdmin):
    list_display = ['team', 'user']
    list_filter = ['team', 'user']
    search_fields = ['team', 'user']


class ReservationAdmin(admin.ModelAdmin):
    list_display = ['id', 'active', 'counter', 'configuration', 'owner', 'branch', 'start_time', 'end_time','days', 'status', 'ute_reservation_id', 'address', 'user', 'password']
    list_filter = ['configuration', 'owner', 'status', 'active']
    search_fields = ['configuration']


admin.site.register(Branch, BranchAdmin)
admin.site.register(APIKey, APIKeyAdmin)
admin.site.register(Configuration, ConfigurationAdmin)
admin.site.register(Reservation, ReservationAdmin)
admin.site.register(Team, TeamAdmin)
admin.site.register(Membership, MembershipAdmin)

