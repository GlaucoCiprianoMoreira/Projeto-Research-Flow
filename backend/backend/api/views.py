from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def get_status(request):
    """
    Um endpoint simples para verificar se a API está online.
    """
    return Response({"status": "ok", "message": "Backend is running!"})
