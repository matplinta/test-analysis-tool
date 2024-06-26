# Generated by Django 4.0.3 on 2022-05-17 08:25

from django.db import migrations
from rep_portal.api import RepPortal

def init_stats_fields(apps, schema_editor):
    # We can't import the Person model directly as it may be a newer
    # version than this migration expects. We use the historical version.
    FilterField = apps.get_model('stats', 'FilterField')
    for elem in RepPortal.TEST_RUN_FILTER_DICT.keys():
        ff = FilterField(name=elem)
        ff.save()

class Migration(migrations.Migration):

    dependencies = [
        ('stats', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(init_stats_fields),
    ]
