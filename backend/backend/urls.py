"""backend URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include

from tra.views import HelloView, TestAuthView, TestSessView, LogoutViewEx, CheckView, UserTestsFilterView, TestlineTypeView
from dj_rest_auth.views import LoginView, LogoutView

from rest_framework import routers
from tra import views

router = routers.DefaultRouter()
router.register(r'test_runs', views.TestRunView, 'testruns')
router.register(r'tests_filters', views.TestsFilterView, 'testsfilters')
router.register(r'test_sets', views.TestsSetView, 'testsets')
router.register(r'testline_types', views.TestlineTypeView, 'testline_types')
router.register(r'user_tests_filters', views.UserTestsFilterView, 'usertestsfilters')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/filtered_testruns/<int:tf_id>/', views.TestRunsBasedOnTestsFiltersView.as_view(), name='filtered_testruns'),
    path('api-auth/login/', LoginView.as_view(), name='rest_login'),
    path('api-auth/logout/', LogoutView.as_view(), name='rest_logout'),  # URLs that require a user to be logged in with a valid session / token.

    path('hello/', HelloView.as_view(), name='hello'),
    path('check/', CheckView.as_view(), name='check'),
    path('test/', TestAuthView.as_view(), name='test'),
    path('session/', TestSessView.as_view(), name='session'),
]
