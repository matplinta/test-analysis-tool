from django.urls import include, path
from .views import main_page

urlpatterns = [
    path('', main_page)
]
