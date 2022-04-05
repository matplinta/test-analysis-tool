from django.db import models

class FilterField(models.Model):
    name = models.CharField(max_length=50, blank=False, null=True, help_text="Field in filter")
    # model = models.ForeignKey(apps.get_model(ContentType.objects.get(model=name).app_label, name), on_delete=models.CASCADE, blank=True, help_text="")

    def __str__(self):
        return self.name

class FilterSet(models.Model):
    name = models.CharField(max_length=50, blank=False, null=True, help_text="Name of test filter")

    def __str__(self):
        return self.name

class Filter(models.Model):
    field = models.ForeignKey(FilterField, on_delete=models.CASCADE, blank=True, help_text="")
    filter_set = models.ForeignKey(FilterSet, on_delete=models.CASCADE, blank=True, help_text="")
    value = models.CharField(max_length=50, blank=False, null=True, help_text="Value")

    def __str__(self):
        return f"{self.field.name}->{self.value}"