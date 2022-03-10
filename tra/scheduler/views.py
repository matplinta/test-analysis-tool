from django.http import HttpResponseRedirect, HttpResponse
from django.views import View
from django.http import JsonResponse
import json
from rest_framework import viewsets
from django.shortcuts import render
from rest_framework import permissions
from rest_framework.permissions import IsAuthenticated
from .forms import CreateReservationForm
from .models import Reservation, APIKey, Configuration, Branch, Membership
from django.views.generic import ListView
from .serializers import ReservationSerializer, APIKeySerializer
from django_tables2 import SingleTableView
from .tables import ReservationsTable, MyReservationsTable
from .filters import ReservationFilter, MyReservationFilter
from django_filters.views import FilterView
from django_tables2.views import SingleTableMixin
from django.views.generic import View
from .forms import EditApiTokenForm, AddConfigurationForm, AddBranchForm, EditReservationForm
from django.core.exceptions import PermissionDenied

import re


def base_template(request):
    return render(request, 'home.html', {})


class ActiveReservationViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = Reservation.objects.filter(active=True)

    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]


class ReservationViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = Reservation.objects.filter()

    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]


class APIKeyViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = APIKey.objects.filter()

    serializer_class = APIKeySerializer
    permission_classes = [permissions.IsAuthenticated]


class ShowReservationsView(SingleTableMixin, FilterView):
    model = Reservation
    table_class = ReservationsTable
    template_name = 'reservations.html'
    filterset_class = ReservationFilter

    table_pagination = {
        "per_page": 20
    }


    # def get(self, request):
    #     if request.user.is_authenticated:
    #         reservations = Reservation.objects.all()
    #
    #         for obj in reservations:
    #             print(obj)
    #         return render(request, 'reservations.html', {"reservations": reservations})
        # form = self.form_class(initial=self.initial)
        # return render(request, self.template_name, {'form': form})


class EditApiTokenView(View):

    def get(self, request):
        if request.user.is_authenticated:
            form = EditApiTokenForm(req_user=request.user)
            return render(request, 'edit_token.html', {'form': form})
        else:
            raise PermissionDenied

    def post(self, request):
        if request.user.is_authenticated:

            form = EditApiTokenForm(req_user=request.user, req=request.POST)

            if form.is_valid():
                key = request.POST.get("api_key", None)

                if APIKey.objects.filter(user=request.user).exists():
                    db_key = APIKey.objects.get(user=request.user)
                    db_key.key = key
                    db_key.save()
                else:
                    APIKey.objects.get_or_create(user=request.user, key=key)

                form = EditApiTokenForm(req_user=request.user)
                msg_type = "success"
                msg = "Token changed."
                return render(request, 'edit_token.html', {'form': form, 'msg': msg, 'msg_type': msg_type})
            else:

                print("nie jest valid")
                form = EditApiTokenForm(req_user=request.user)
                msg_type = "error"
                msg = "Incorrect token."
                return render(request, 'edit_token.html', {'form': form, 'msg': msg, 'msg_type': msg_type})

            raise PermissionDenied


class AddConfiguration(View):

    def get(self, request):
        if request.user.is_authenticated and 'trs_admin' in request.user.groups.values_list('name', flat=True):
            form = AddConfigurationForm()
            return render(request, 'add_configuration.html', {'form': form})
        else:
            raise PermissionDenied

    def post(self, request):
        if request.user.is_authenticated and 'trs_admin' in request.user.groups.values_list('name', flat=True):

            form = AddConfigurationForm(request.POST)

            if form.is_valid():

                configuration_name = request.POST.get("configuration", None)

                if configuration_name is None:
                    msg_type = "error"
                    msg = "Empty configuration name."
                    return render(request, 'add_configuration.html', {'form': form, 'msg': msg, 'msg_type': msg_type})

                if Configuration.objects.filter(name=configuration_name).exists():
                    msg_type = "error"
                    msg = "Configuration currently exist in database."
                    return render(request, 'add_configuration.html', {'form': form, 'msg': msg, 'msg_type': msg_type})

                db_configuration = Configuration.objects.create(name=configuration_name)
                if db_configuration:
                    msg_type = "success"
                    msg = "Configuration added."
                    return render(request, 'add_configuration.html', {'form': form, 'msg': msg, 'msg_type': msg_type})

                else:
                    msg_type = "error"
                    msg = "Cannot add configuration."
                    return render(request, 'add_configuration.html', {'form': form, 'msg': msg, 'msg_type': msg_type})

            else:
                print("nie ok")
                msg_type = "error"
                msg = "Incorrect configuration."
                return render(request, 'add_configuration.html', {'form': form, 'msg': msg, 'msg_type': msg_type})

class AddBranch(View):

    def get(self, request):
        if request.user.is_authenticated and 'trs_admin' in request.user.groups.values_list('name', flat=True):
            form = AddBranchForm()
            return render(request, 'add_branch.html', {'form': form})
        else:
            raise PermissionDenied

    def post(self, request):
        if request.user.is_authenticated and 'trs_admin' in request.user.groups.values_list('name', flat=True):

            form = AddBranchForm(request.POST)

            if form.is_valid():

                branch_name = request.POST.get("name", None)

                if branch_name is None:
                    msg_type = "error"
                    msg = "Empty branch name."
                    return render(request, 'add_branch.html', {'form': form, 'msg': msg, 'msg_type': msg_type})

                if Branch.objects.filter(name=branch_name).exists():
                    msg_type = "error"
                    msg = "Branch currently exist in database."
                    return render(request, 'add_branch.html', {'form': form, 'msg': msg, 'msg_type': msg_type})

                db_branch = Branch.objects.create(name=branch_name)
                if db_branch:
                    msg_type = "success"
                    msg = "Branch added."
                    return render(request, 'add_branch.html', {'form': form, 'msg': msg, 'msg_type': msg_type})

                else:
                    msg_type = "error"
                    msg = "Cannot add branch."
                    return render(request, 'add_branch.html', {'form': form, 'msg': msg, 'msg_type': msg_type})

            else:
                msg_type = "error"
                msg = "Incorrect branch."
                return render(request, 'add_branch.html', {'form': form, 'msg': msg, 'msg_type': msg_type})


class ShowMyReservationsView(SingleTableMixin, FilterView):
    model = Reservation
    table_class = MyReservationsTable
    template_name = 'my_reservations.html'
    filterset_class = MyReservationFilter

    table_pagination = {
        "per_page": 20
    }

    def get_queryset(self):
        return Reservation.objects.all().filter(owner=self.request.user.id).order_by('-id')


class ShowCreateReservationsView(View):
    model = Reservation
    template_name = 'create_reservations.html'
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        if request.user.is_authenticated:
            form = CreateReservationForm(None)
            return render(request, 'create_reservation.html', {'form': form})

        else:
            raise PermissionDenied

    def post(self, request):
        if request.method == "POST":
            incorrect_data = check_if_correct_values(request)
            if len(incorrect_data) > 0:
                msg = "Incorrect data:"
                msg_type = 'error'
                for key, value in incorrect_data.items():
                    msg = msg + " {}: {}".format(key, value)

                form = CreateReservationForm()
                return render(request, 'create_reservation.html', {'form': form, 'msg': msg, 'msg_type': msg_type})

            form = CreateReservationForm(request.POST)
            if form.is_valid():
                post = form.save(commit=False)
                post.owner_username = request.user
                print(post)
                post.save()
                return HttpResponseRedirect('/scheduler/my-reservations/')


class EditReservation(View):

    def get(self, request, reservation_id):
        if request.user.is_authenticated:
            reservation = Reservation.objects.get(pk=reservation_id)
            form = EditReservationForm(instance=reservation)
            if check_reservation_owner(reservation_id) != request.user and 'trs_admin' not in request.user.groups.values_list('name', flat=True):
                msg = "You are not a owner of this reservation."
                msg_type = 'error'
                return render(request, 'edit_reservation.html',  {'form': form, 'msg': msg, 'msg_type': msg_type})

            return render(request, 'edit_reservation.html', {'form': form})

    def post(self, request, reservation_id):
        if request.user.is_authenticated:
            reservation = Reservation.objects.get(pk=reservation_id)

            if check_reservation_owner(reservation_id) != request.user and 'trs_admin' not in request.user.groups.values_list('name', flat=True):
                msg = "You are not a owner of this reservation."
                msg_type = 'error'
                form = EditReservationForm(instance=reservation)
                return render(request, 'edit_reservation.html',  {'form': form, 'msg': msg, 'msg_type': msg_type})

            incorrect_data = check_if_correct_values(request)
            if len(incorrect_data) > 0:
                msg = "Incorrect data:"
                msg_type = 'error'
                for key, value in incorrect_data.items():
                    msg = msg + " {}: {}".format(key, value)

                form = EditReservationForm(instance=reservation)
                return render(request, 'edit_reservation.html',  {'form': form, 'msg': msg, 'msg_type': msg_type})

            form = EditReservationForm(request.POST, instance=reservation)
            if form.is_valid():

                post = form.save(commit=False)
                post.owner_username = request.user
                print(post)
                post.save()
                msg = "Reservation updated."
                msg_type = 'success'
                return render(request, 'edit_reservation.html', {'form': form, 'msg': msg, 'msg_type': msg_type})


class DeleteReservationView(View):

    def post(self, request):
        if request.is_ajax() and request.user.is_authenticated:
            reservation_id = request.POST.get("reservation_id", None)
            if reservation_id is None:
                msg = "Not defined reservation id:"
                msg_type = 'error'
                json_response = {"redirect": True, 'msg': msg, 'msg_type': msg_type}
                return HttpResponse(json.dumps(json_response), content_type='application/json')

            if check_reservation_owner(reservation_id) != request.user and 'trs_admin' not in request.user.groups.values_list('name', flat=True):
                msg = "You are not a owner of this reservation."
                msg_type = 'error'
                json_response = {"redirect": True, 'msg': msg, 'msg_type': msg_type}
                return HttpResponse(json.dumps(json_response), content_type='application/json')

            instance = Reservation.objects.get(id=reservation_id)
            instance.delete()

            msg = "Reservation removed."
            msg_type = 'success'
            json_response = {"redirect": True, 'msg': msg, 'msg_type': msg_type}
            return HttpResponse(json.dumps(json_response), content_type='application/json')


def check_reservation_owner(reservation_id):
    owner = Reservation.objects.get(pk=reservation_id).owner
    return owner


def check_if_correct_values(request):
    start_time = request.POST.get("start_time", None)
    end_time = request.POST.get("end_time", None)
    incorrect_data = {}
    time_pattern = r"^\d\d:\d\d:\d\d$"
    print(start_time)
    print(end_time)
    if start_time is None or re.match(time_pattern, start_time) is None:
        incorrect_data["start_time"] = start_time

    if end_time is None or re.match(time_pattern, end_time) is None:
        incorrect_data["end_time"] = end_time

    return incorrect_data
