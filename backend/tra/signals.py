from django.db.models.signals import post_delete
from django.dispatch import receiver
from . import models
from .storage import get_storage_instance

@receiver(post_delete, sender=models.LastPassingLogs)
def delete_logs_in_storage(sender, instance: models.LastPassingLogs, using, **kwargs):
    storage = get_storage_instance()
    if instance.location:
        resp = storage.delete(name=instance.location)
    