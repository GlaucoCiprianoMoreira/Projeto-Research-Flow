from rest_framework.decorators import api_view
from rest_framework.response import Response

# Novas importações
from drf_spectacular.utils import extend_schema
from .serializers import SearchQuerySerializer, ArticleSerializer

# Importações dos nossos serviços
from explorer.services import extract_keywords_with_gemini, search_articles_from_api

@extend_schema(exclude=True) # Opcional: esconde o endpoint de status da documentação
@api_view(['GET'])
def get_status(request):
    """
    Um endpoint simples para verificar se a API está online.
    """
    return Response({"status": "ok", "message": "Backend is running!"})


# A MÁGICA ACONTECE AQUI
@extend_schema(
    summary="Busca Artigos com IA",
    description="Recebe uma query de busca em linguagem natural, usa IA para otimizá-la e retorna os 5 artigos mais relevantes encontrados no Semantic Scholar.",
    request=SearchQuerySerializer,
    responses={
        200: ArticleSerializer(many=True), # Se der sucesso (200), a resposta é uma LISTA de Artigos
        400: {"description": "Erro de requisição, como uma query vazia."}
    }
)
@api_view(['POST'])
def search_articles_view(request):
    """
    Recebe uma query em linguagem natural, extrai os keywords com IA
    e retorna uma lista de artigos.
    """
    # Validação automática com o serializer (boa prática)
    serializer = SearchQuerySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    natural_query = serializer.validated_data['query']

    keywords = extract_keywords_with_gemini(natural_query)

    articles = search_articles_from_api(keywords)

    return Response(articles)