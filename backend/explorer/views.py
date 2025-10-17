from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Importe as duas funções do nosso módulo de serviços
from explorer.services import extract_keywords_with_gemini, search_articles_from_api

# Esta view já existe, você só precisa garantir que o conteúdo dela
# esteja igual ao abaixo
@api_view(['GET'])
def get_status(request):
    """
    Um endpoint simples para verificar se a API está online.
    """
    return Response({"status": "ok", "message": "Backend is running!"})

# SUBSTITUA A VERSÃO ANTIGA DESTA VIEW PELA NOVA ABAIXO
@api_view(['POST'])
def search_articles_view(request):
    """
    Recebe uma query em linguagem natural, extrai os keywords com IA
    e retorna uma lista de artigos.
    """
    # 1. Pega a frase completa enviada pelo front-end
    natural_query = request.data.get('query', '')
    if not natural_query:
        return Response({"error": "Query não fornecida."}, status=400)

    # 2. Envia a frase para o Gemini extrair as palavras-chave
    keywords = extract_keywords_with_gemini(natural_query)
    if not keywords:
         return Response({"error": "Não foi possível extrair termos da busca."}, status=400)

    # 3. Usa as palavras-chave limpas para buscar os artigos (ainda com dados falsos)
    articles = search_articles_from_api(keywords)

    return Response(articles)
