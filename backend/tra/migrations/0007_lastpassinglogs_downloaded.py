# Generated by Django 4.0.3 on 2022-09-07 08:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tra', '0006_alter_lastpassinglogs_size'),
    ]

    operations = [
        migrations.AddField(
            model_name='lastpassinglogs',
            name='downloaded',
            field=models.BooleanField(blank=True, default=False, help_text='Indicates if logs has been downloaded', null=True),
        ),
    ]