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
from .views import UsersList

router = routers.DefaultRouter()
router.register(r'users', UsersList, 'users')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/login/', LoginView.as_view(), name='rest_login'),
    path('api-auth/logout/', views.LogoutViewEx.as_view(), name='rest_logout'),  # URLs that require a user to be logged in with a valid session / token.
    path('api/tra/', include('tra.urls'), name="api_tra"),
    path('api/tra/stats/', include('stats.urls'), name="api_tra_stats"),
    path('api/tlm/', include('testline_manager.urls'), name="api_tlm"),
    # path('api/trs/', include('trs.urls'), name="api_trs"),
    path('api/', include(router.urls)),

]
