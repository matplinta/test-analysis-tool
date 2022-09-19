from django.apps import AppConfig


class TraConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tra'

    def ready(self):
        from . import signals
