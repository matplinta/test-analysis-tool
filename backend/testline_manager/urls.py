from django.urls import path

from .views import base_template, TestlineView

urlpatterns = [
    path('', base_template, name="testline_menager"),
    path('testline/<int:testline_id>', TestlineView.as_view(), name="testline-view"),

]
