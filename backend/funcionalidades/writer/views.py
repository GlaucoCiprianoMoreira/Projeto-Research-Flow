from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Importe as duas funções do nosso módulo de serviços
from writer.services import format_text_with_gemini

@api_view(['GET'])
def get_status(request):
    """
    Um endpoint simples para verificar se a API está online.
    """
    return Response({"status": "ok", "message": "Backend is running!"})

@api_view(['POST'])
def format_text_view(request):
    """
    Recebe um texto e um estilo, formata o texto usando Gemini
    e retorna o caminho do arquivo PDF gerado.
    """
    input_text = request.data.get('text')
    style = request.data.get('style')
    
    if not input_text:
        return Response({"error": "Texto não fornecido."}, status=400)
    
    success = format_text_with_gemini(input_text, style)
    if success:
        return Response({"message": "Texto formatado e PDF gerado com sucesso."})
    else:
        return Response({"error": "Falha ao formatar o texto."}, status=500)