from django.forms import ModelForm
from .models import Reservation, APIKey, Configuration, Branch
from django import forms


class CreateReservationForm(ModelForm):
    class Meta:
        model = Reservation
        fields = ["configuration", "branch", "start_time", "end_time", "days", "counter"]


def get_users_token(user):

    if user and APIKey.objects.filter(user=user):
        api_key = APIKey.objects.get(user=user).key
        print(api_key)
        return api_key
    else:
        return "your token"


def get_configurations_list():
    CONFIGURATION_LIST = forms.ModelChoiceField(Configuration.objects.filter().order_by('name'), label="Configuration")
    return CONFIGURATION_LIST


def get_branches_list():
    BRANCH_LIST = forms.ModelChoiceField(Branch.objects.filter().order_by('name'), label="Branch")
    return BRANCH_LIST

class EditApiTokenForm(forms.Form):

    def __init__(self, req_user, req=None,  *args, **kwargs):
        super(EditApiTokenForm, self).__init__(req, *args, **kwargs)

        self.fields['api_key'] = forms.CharField(max_length=50,
                                                 min_length=4,
                                                 label="UTE CLOUD API TOKEN",
                                                 required=True,
                                                 initial=get_users_token(req_user)
                                                 )


class AddConfigurationForm(forms.Form):

    def __init__(self, *args, **kwargs):
        super(AddConfigurationForm, self).__init__(*args, **kwargs)

        self.fields['configuration'] = forms.CharField(max_length=80,
                                                       min_length=10,
                                                       required=True
                                                       )

class AddBranchForm(forms.Form):

    def __init__(self, *args, **kwargs):
        super(AddBranchForm, self).__init__(*args, **kwargs)

        self.fields['name'] = forms.CharField(max_length=10,
                                              min_length=4,
                                              required=True
                                              )


class EditReservationForm(ModelForm):
    class Meta:
        model = Reservation
        fields = ["configuration", "branch", "start_time", "end_time", "days", "active", "counter"]
