from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema

# Importa TODOS os serializers do arquivo que acabamos de criar
from .serializers import (
    SearchQuerySerializer, 
    ApiResponseSerializer,
    SummarizeInputSerializer, 
    SummarizeOutputSerializer
)

# Importa a lógica de CADA app separado
from explorer.services import extract_keywords_with_gemini, search_articles_from_api
from analyzer.services import summarize_article


@extend_schema(exclude=True)
@api_view(['GET'])
def get_status(request):
    """ Um endpoint simples para verificar se a API está online. """
    return Response({"status": "ok", "message": "Backend is running!"})


@extend_schema(
    summary="Busca Artigos com IA",
    description="Recebe uma query de busca em linguagem natural, usa IA para otimizá-la e retorna os 5 artigos mais relevantes encontrados.",
    request=SearchQuerySerializer,
    responses={
        200: ApiResponseSerializer,
        400: {"description": "Erro de requisição, como uma query vazia."}
    }
)
@api_view(['POST'])
def search_articles_view(request):
    """
    Endpoint para buscar artigos.
    """
    serializer = SearchQuerySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    natural_query = serializer.validated_data['query']
    keywords = extract_keywords_with_gemini(natural_query)
    articles = search_articles_from_api(keywords)

    if "error" in articles:
        response_data = {
            "success": False,
            "message": "Puxa, tive um problema para me conectar à base de dados. Tente novamente em alguns instantes.",
            "articles": []
        }
        return Response(response_data, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    if len(articles) > 0:
        response_data = {
            "success": True,
            "message": f"Encontrei {len(articles)} artigos excelentes para você! Que tal explorar outro tópico?",
            "articles": articles
        }
    else:
        response_data = {
            "success": True,
            "message": "Puxa, não encontrei artigos com esses termos. Que tal tentarmos uma busca diferente?",
            "articles": []
        }
    return Response(response_data, status=status.HTTP_200_OK)


@extend_schema(
    summary="Resume um Artigo (via Texto ou URL de PDF)",
    description="Recebe o texto de um artigo ou a URL de um PDF. O backend baixa o PDF (se for URL), extrai o texto e usa a IA para gerar um resumo estruturado.",
    request=SummarizeInputSerializer,
    responses={
        200: SummarizeOutputSerializer,
        400: {"description": "Erro de validação (ex: campos faltando)."},
        500: {"description": "Erro interno (ex: falha ao ler PDF ou IA offline)."}
    }
)
@api_view(['POST'])
def summarize_article_view(request):
    """
    Endpoint para resumir um artigo a partir de texto ou URL.
    """
    serializer = SummarizeInputSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    input_val = serializer.validated_data['input_value']
    is_url_val = serializer.validated_data['is_url']
    
    # Chama a lógica que está em analyzer/services.py
    result = summarize_article(input_val, is_url=is_url_val)
    
    if "error" in result:
        return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(result, status=status.HTTP_200_OK)