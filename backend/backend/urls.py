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

from rest_framework import routers
from dj_rest_auth.views import LoginView, LogoutView
from tra import views
from stats import views as stats_views


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/login/', LoginView.as_view(), name='rest_login'),
    path('api-auth/logout/', LogoutView.as_view(), name='rest_logout'),  # URLs that require a user to be logged in with a valid session / token.
    path('api/', include('tra.urls'), name="api"),
    path('stats/', include('stats.urls'), name="stats"),


    path('load/', views.LoadTestRunsToDBView.as_view(), name='load'),
    path('hello/', views.HelloView.as_view(), name='hello'),
    path('check/', views.CheckView.as_view(), name='check'),
    path('test/', views.TestAuthView.as_view(), name='test'),
    path('session/', views.TestSessView.as_view(), name='session'),
]
