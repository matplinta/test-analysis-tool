# Generated by Django 4.0.3 on 2023-03-30 12:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tra', '0020_alter_testinstance_options'),
    ]

    operations = [
        migrations.AddField(
            model_name='testinstance',
            name='test_entity',
            field=models.CharField(blank=True, help_text='Test Entity', max_length=30, null=True),
        ),
        migrations.AddField(
            model_name='testrun',
            name='exec_trigger',
            field=models.CharField(blank=True, help_text='Execution trigger (test entity) CIT/CDRT/CRT', max_length=30, null=True),
        ),
    ]
