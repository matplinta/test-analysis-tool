# Generated by Django 4.0.3 on 2022-08-05 15:11

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('stats', '0003_alter_filter_value'),
    ]

    operations = [
        migrations.AlterField(
            model_name='filter',
            name='filter_set',
            field=models.ForeignKey(help_text='Name of associated filter set', on_delete=django.db.models.deletion.CASCADE, related_name='filters', to='stats.filterset'),
        ),
    ]