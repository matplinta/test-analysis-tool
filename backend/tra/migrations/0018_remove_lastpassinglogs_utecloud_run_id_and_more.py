# Generated by Django 4.0.3 on 2022-11-21 15:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tra', '0017_lastpassinglogs_utecloud_run_id_char'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='lastpassinglogs',
            name='utecloud_run_id',
        ),
        migrations.AlterField(
            model_name='lastpassinglogs',
            name='utecloud_run_id_char',
            field=models.CharField(default=None, max_length=250, unique=True),
        ),
    ]