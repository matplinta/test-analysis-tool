# Generated by Django 4.0.3 on 2023-03-31 12:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tra', '0021_testinstance_test_entity_testrun_exec_trigger'),
    ]

    operations = [
        migrations.AddField(
            model_name='testrun',
            name='execution_id',
            field=models.CharField(blank=True, help_text='UTE Cloud execution id', max_length=100, null=True),
        ),
    ]
