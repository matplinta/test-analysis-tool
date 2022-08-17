from django.contrib import admin

from .models import (
    FilterSet, Filter, FilterField
)


class FilterAdmin(admin.ModelAdmin):
    list_display = ['field', 'id', 'value', 'filter_set']
    list_filter = ['filter_set', 'field']
    search_fields = ['field', 'filter_set', 'value']


class FilterFieldAdmin(admin.ModelAdmin):
    list_display = ['name', 'id']
    list_filter = ['name']
    search_fields = ['name']

class FilterSetAdmin(admin.ModelAdmin):
    list_display = ['name', 'id', 'author']
    list_filter = ['name', 'author']
    search_fields = ['name', 'author']

    
admin.site.register(FilterField, FilterFieldAdmin)
admin.site.register(Filter, FilterAdmin)
admin.site.register(FilterSet, FilterSetAdmin)