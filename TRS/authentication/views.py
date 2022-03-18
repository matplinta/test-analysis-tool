import json

from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt

from .response import Response


@csrf_exempt
def user_login(request):
    if request.method == 'POST':
        credentials = request.POST.get('credentials', None)
        if credentials is not None:
            credentials = json.loads(credentials)
            username = credentials['username']
            password = credentials['password']
            keep_logged = credentials['remember']
            if not keep_logged:
                request.session.set_expiry(0)  # do not remember users credentials
            user = authenticate(username=username, password=password)
            if user is not None:
                if user.is_active:
                    login(request, user)
                    return Response.success()
                else:
                    return Response.fail('The password is valid, but the account has been disabled!')
            return Response.fail('Invalid login details supplied.')
        return Response.error('User credentials not specified or internal error has occurred. Pleas contact admin.')
    return Response.error("Internal error. Please contact admin")


@csrf_exempt
def user_logout(request):
    if request.method == 'POST':
        if request.user.is_authenticated:
            logout(request)
            return Response.success()
        return Response.fail("User is not authenticated.")
    return Response.error("Internal error. Please contact admin")
