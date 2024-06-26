from django.contrib.auth.models import User, Group
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from . import models
from . import tasks as celery_tasks
from .storage import get_storage_instance
from .utils import get_common_users_group


# @receiver(post_delete, sender=models.LastPassingLogs)
# def delete_logs_in_storage(sender, instance: models.LastPassingLogs, using, **kwargs):
#     storage = get_storage_instance()
#     if instance.location:
#         storage.delete(name=instance.location)


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        instance.groups.add(get_common_users_group())


# @receiver(post_save, sender=models.TestSetFilter)
# def schedule_pull_from_rp(sender, instance: models.TestSetFilter, created, **kwargs):
#     celery_tasks.celery_pull_testruns_by_testsetfilters.delay(testset_filters_ids=[instance.id], user_ids=[user.id for user in instance.owners.all()])
