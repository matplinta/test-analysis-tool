# Generated by Django 4.0.3 on 2022-11-21 15:27

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tra', '0018_remove_lastpassinglogs_utecloud_run_id_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='lastpassinglogs',
            name='utecloud_run_id_char',
            field=models.CharField(max_length=250, unique=True)
        ),
        migrations.RenameField(
        model_name='lastpassinglogs',
        old_name='utecloud_run_id_char',
        new_name='utecloud_run_id',
        ),
    ]