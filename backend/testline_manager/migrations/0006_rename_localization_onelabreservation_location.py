# Generated by Django 4.0.3 on 2022-06-23 13:58

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('testline_manager', '0005_team_remove_onelabreservation_one_lab_status_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='onelabreservation',
            old_name='localization',
            new_name='location',
        ),
    ]