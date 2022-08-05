# Generated by Django 4.0.3 on 2022-08-04 13:21

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def forwards_func(apps, schema_editor):
    # We get the model from the versioned app registry;
    # if we directly import it, it'll be the wrong version
    RegressionFilter = apps.get_model("tra", "RegressionFilter")
    TestSet = apps.get_model("tra", "TestSet")
    TestSetFilter = apps.get_model("tra", "TestSetFilter")
    # db_alias = schema_editor.connection.alias
    for reg_filter in RegressionFilter.objects.all():
        tsf = TestSetFilter(
            limit=reg_filter.limit,
            test_set_name=reg_filter.test_set.name,
            test_lab_path=reg_filter.test_set.test_lab_path,
            branch = reg_filter.test_set.branch,
            testline_type=reg_filter.testline_type
        )
        tsf.save()
        tsf.fail_message_type_groups.set(reg_filter.fail_message_type_groups.all())
        tsf.owners.set(reg_filter.owners.all())
        tsf.subscribers.set(reg_filter.subscribers.all())


def reverse_func(apps, schema_editor):
    # forwards_func() creates two Country instances,
    # so reverse_func() should delete them.
    TestSetFilter = apps.get_model("tra", "TestSetFilter")
    db_alias = schema_editor.connection.alias
    TestSetFilter.objects.using(db_alias).all().delete()


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('tra', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='testrun',
            name='airphone',
            field=models.TextField(blank=True, help_text='Airphone Build', max_length=100, null=True),
        ),
        migrations.CreateModel(
            name='TestSetFilter',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('limit', models.IntegerField(default=50, help_text='Number of test runs pulled from Reporting Portal during every refresh')),
                ('test_set_name', models.TextField(help_text='QC Test Set', max_length=300, null=True)),
                ('test_lab_path', models.TextField(help_text='Test Lab Path', max_length=300, null=True)),
                ('branch', models.ForeignKey(blank=True, help_text='Branch, field set automatically', on_delete=django.db.models.deletion.CASCADE, to='tra.branch')),
                ('fail_message_type_groups', models.ManyToManyField(blank=True, to='tra.failmessagetypegroup')),
                ('owners', models.ManyToManyField(blank=True, related_name='owned_testsets', to=settings.AUTH_USER_MODEL)),
                ('subscribers', models.ManyToManyField(blank=True, related_name='subscribed_testsets', to=settings.AUTH_USER_MODEL)),
                ('testline_type', models.ForeignKey(help_text='Testline type', on_delete=django.db.models.deletion.CASCADE, to='tra.testlinetype')),
            ],
            options={
                'ordering': ['id'],
            },
        ),
        migrations.AddConstraint(
            model_name='testsetfilter',
            constraint=models.UniqueConstraint(fields=('test_set_name', 'test_lab_path', 'testline_type'), name='test_set_uniq_constr'),
        ),
        migrations.RunPython(forwards_func, reverse_func),
    ]
