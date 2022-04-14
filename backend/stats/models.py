from django.db import models
from django.contrib.auth.models import User

class FilterField(models.Model):
    name = models.CharField(unique=True, max_length=50, blank=False, null=False, help_text="Field in filter")
    # model = models.ForeignKey(apps.get_model(ContentType.objects.get(model=name).app_label, name), on_delete=models.CASCADE, blank=True, help_text="")

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.name

class FilterSet(models.Model):
    name   = models.CharField(max_length=100, blank=False, null=False, help_text="Name of the filter set")
    author = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["name", "author"], name='name_author_uniq')]
        ordering = ['id']

    def __str__(self):
        return self.name

class Filter(models.Model):
    field = models.ForeignKey(FilterField, on_delete=models.CASCADE, blank=False, help_text="Filter field")
    filter_set = models.ForeignKey(FilterSet, on_delete=models.CASCADE, blank=False, help_text="Name of associated filter set")
    value = models.CharField(max_length=200, blank=True, null=False, help_text="Value")

    class Meta:
        constraints = [models.UniqueConstraint(fields=["field", "filter_set"], name='filter_constraint')]
        ordering = ['id']

    def __str__(self):
        return f"{self.field.name}->{self.value}"