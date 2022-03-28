from django.forms import ModelForm
from .models import TestsFilter
from django import forms


class CreateTestsFilterForm(ModelForm):
    class Meta:
        model = TestsFilter
        fields = ['name', 'test_set', 'testline_type']