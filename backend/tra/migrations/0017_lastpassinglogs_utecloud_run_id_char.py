# Generated by Django 4.0.3 on 2022-11-21 15:12

from django.db import migrations, models


def populate_uterun_id_data(apps, schema_editor):
    LastPassingLogs = apps.get_model("tra", "LastPassingLogs")
    db_alias = schema_editor.connection.alias

    for logs in LastPassingLogs.objects.using(db_alias).all():
        logs.utecloud_run_id_char = str(logs.utecloud_run_id)
        logs.save()

class Migration(migrations.Migration):

    dependencies = [
        ('tra', '0016_alter_failmessagetype_regex'),
    ]

    operations = [
        migrations.AddField(
            model_name='lastpassinglogs',
            name='utecloud_run_id_char',
            field=models.CharField(max_length=250, null=True, unique=True),
        ),
        migrations.RunPython(populate_uterun_id_data),
    ]
