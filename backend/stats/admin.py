from django.contrib import admin

from .models import (
    FilterSet, Filter, FilterField
)


class FilterAdmin(admin.ModelAdmin):
    list_display = ['field', 'filter_set', 'value']
    list_filter = ['filter_set', 'field']
    search_fields = ['field', 'filter_set', 'value']


class FilterDefinitionAdmin(admin.ModelAdmin):
    list_display = ['name']
    list_filter = ['name']
    search_fields = ['name']

class FilterSetAdmin(admin.ModelAdmin):
    list_display = ['name', 'id']
    list_filter = ['name']
    search_fields = ['name']

    
admin.site.register(FilterField, FilterDefinitionAdmin)
admin.site.register(Filter, FilterAdmin)
admin.site.register(FilterSet, FilterSetAdmin)