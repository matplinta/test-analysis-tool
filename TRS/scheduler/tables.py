import django_tables2 as tables
from django_tables2 import LinkColumn
from django_tables2.utils import A

from .models import Reservation, Membership
from datetime import datetime


class MembershipTable(tables.Table):
    team = tables.Column()


class ReservationsTable(tables.Table):
    class Meta:
        model = Reservation
        template_name = "django_tables2/bootstrap4.html"
        fields = ("id", "active", "counter", "configuration", "owner", "branch", "start_time", "end_time", "days", "status", "address", "user", "password", "team")
        attrs = {'font-size': '100px'}

    team = tables.Column()

    def render_start_time(self, value):
        return value.strftime('%H:%M')

    def render_end_time(self, value):
        return value.strftime('%H:%M')

    def render_team(self, value):
        teams = Membership.objects.all().filter(user=self.request.user.id)
        return teams[0].team


class MyReservationsTable(tables.Table):
    # edit = tables.TemplateColumumn(template_name='delete_template.html', orderable=False)
    remove = tables.TemplateColumn(template_name='delete_template.html', orderable=False)
    edit = tables.TemplateColumn(template_name='reservation_edit_button.html', orderable=False)

    # edit = tables.TemplateColumn(
    #     "<a class='btn btn-warning btn-sm' href='{% url 'reservation-update' record.id %}'>Edit</a>")
    # remove = tables.TemplateColumn(
    #     "<a class='btn btn-danger btn-sm'>Delete</a>")

    class Meta:
        model = Reservation
        template_name = "django_tables2/bootstrap4.html"
        attrs = {'class': 'table table-sm'}
        fields = ("id", "active", "counter", "configuration", "owner", "branch", "start_time", "end_time", "days", "status", "address", "user", "password")

    def render_start_time(self, value):
        return value.strftime('%H:%M')

    def render_end_time(self, value):
        return value.strftime('%H:%M')
