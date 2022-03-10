from django.db import models
from django_currentuser.middleware import (get_current_user, get_current_authenticated_user)
from django_currentuser.db.models import CurrentUserField
from django.conf import settings
from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth.models import AbstractUser


class Team(models.Model):
    def __str__(self):
        return self.name

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255, blank=False, unique=True)


# class UserProfile(models.Model):
#     user = models.OneToOneField(User)
#     team = models.ForeignKey(Team, on_delete=models.CASCADE, blank=False)
#
#     def __str__(self):
#           return "%s's profile" % self.user


class Configuration(models.Model):
    def __str__(self):
        return self.name

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255, blank=False, unique=True)


class Membership(models.Model):

    id = models.BigAutoField(primary_key=True)
    user = CurrentUserField()
    team = models.ForeignKey(Team, on_delete=models.CASCADE, blank=False)

    class Meta:
        unique_together = ('user', 'team',)


class Branch(models.Model):
    def __str__(self):
        return self.name

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=10, blank=False, unique=True)

    class Meta:
        verbose_name_plural = 'Branches'


class Reservation(models.Model):

    def __unicode__(self):
        return self.configuration

    id = models.BigAutoField(primary_key=True, help_text="TRS ID reservation.")
    configuration = models.ForeignKey(Configuration, on_delete=models.CASCADE, blank=False,
                                      help_text="Configuration to schedule.")
    owner = CurrentUserField()
    active = models.BooleanField(default=True, help_text="Set as False to turn off reservation.")
    start_time = models.TimeField(blank=False, null=False, default='07:00:00', verbose_name='Start', help_text="Start time of reservation.")
    end_time = models.TimeField(blank=False, null=False, default='17:00:00', verbose_name='End', help_text="End time of reservation.")
    days = models.CharField(max_length=300,
                            blank=False,
                            default='Monday-Friday',
                            help_text='Days when reservation is activated. Separated by ",". '
                                      'In case of range use "-" to define it. e.g. "Monday-Thursday,Sun"')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    build = models.CharField(blank=True, null=True, max_length=40)
    ute_reservation_id = models.IntegerField(blank=True,
                                             null=True,
                                             help_text="This field will be filled automatically.")
    status = models.CharField(max_length=20,
                              blank=True,
                              null=True,
                              help_text="This field will be filled automatically.")
    user = models.CharField(max_length=20,
                            blank=True,
                            null=True,
                            help_text="This field will be filled automatically.")
    password = models.CharField(max_length=20,
                                blank=True,
                                null=True,
                                help_text="This field will be filled automatically.")
    address = models.CharField(max_length=100,
                               blank=True,
                               null=True,
                               help_text="This field will be filled automatically.")
    counter = models.IntegerField(blank=False,
                                                     null=False,
                                                     default=5,
                                                     help_text="Reservation count.After reservation this count will"
                                                               " be decreased. In the case of 0, the reservation will "
                                                               "not be possible")


class APIKey(models.Model):
    def __str__(self):
        return self.key

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, unique=True)
    key = models.CharField(max_length=255, blank=False, unique=True)
