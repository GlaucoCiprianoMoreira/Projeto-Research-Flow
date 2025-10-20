from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from drf_spectacular.utils import extend_schema

# Importe o novo serializer de resposta
from .serializers import SearchQuerySerializer, ArticleSerializer, ApiResponseSerializer

from explorer.services import extract_keywords_with_gemini, search_articles_from_api

@extend_schema(exclude=True)
@api_view(['GET'])
def get_status(request):
    """ Um endpoint simples para verificar se a API está online. """
    return Response({"status": "ok", "message": "Backend is running!"})


@extend_schema(
    summary="Busca Artigos com IA",
    description="Recebe uma query de busca em linguagem natural, usa IA para otimizá-la e retorna os 5 artigos mais relevantes encontrados.",
    request=SearchQuerySerializer,
    # ATUALIZADO: Agora a resposta 200 é o nosso novo objeto carismático
    responses={
        200: ApiResponseSerializer,
        400: {"description": "Erro de requisição, como uma query vazia."}
    }
)
@api_view(['POST'])
def search_articles_view(request):
    """
    Recebe uma query em linguagem natural, extrai os keywords com IA
    e retorna uma lista de artigos.
    """
    serializer = SearchQuerySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    natural_query = serializer.validated_data['query']

    keywords = extract_keywords_with_gemini(natural_query)

    articles = search_articles_from_api(keywords)

    # --- A LÓGICA DA RESPOSTA CARISMÁTICA ---

    if "error" in articles:
        # Se a API externa falhou
        response_data = {
            "success": False,
            "message": "Puxa, tive um problema para me conectar à base de dados. Tente novamente em alguns instantes.",
            "articles": []
        }
        return Response(response_data, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    if len(articles) > 0:
        # Se encontramos artigos
        response_data = {
            "success": True,
            "message": f"Encontrei {len(articles)} artigos excelentes para você! Que tal explorar outro tópico?",
            "articles": articles
        }
    else:
        # Se a busca foi bem-sucedida, mas não retornou nada
        response_data = {
            "success": True,
            "message": "Puxa, não encontrei artigos com esses termos. Que tal tentarmos uma busca diferente?",
            "articles": []
        }

    return Response(response_data, status=status.HTTP_200_OK)