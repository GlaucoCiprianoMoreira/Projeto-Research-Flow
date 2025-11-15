from django.urls import path
from .views import get_status

urlpatterns = [
    path('status/', get_status, name='get-status'),
]