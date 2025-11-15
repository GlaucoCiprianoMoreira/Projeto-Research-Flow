from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

# Importa TODOS os serializers do arquivo que acabamos de criar
from .serializers import (
    SearchQuerySerializer, 
    ApiResponseSerializer,
    SummarizeJsonInputSerializer, 
    SummarizeFormInputSerializer,
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


# --- FUNÇÃO HELPER (para não repetir código) ---
def _handle_summarize_response(result):
    """ Processa a resposta do serviço de resumo e retorna a Response. """
    if "error" in result:
        # Erros de processamento (PDF ilegível, falha no download)
        if "Falha ao ler" in result.get("error", "") or "Falha ao baixar" in result.get("error", ""):
             return Response(result, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        # Outros erros (ex: falha na IA)
        return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(result, status=status.HTTP_200_OK)


# --- VIEW 1: RESUMO POR JSON (TEXTO/URL) ---
@extend_schema(
    summary="[JSON] Resume um Artigo por Texto ou URL",
    description="""Recebe o texto de um artigo ou a URL de um PDF via JSON 
    e usa IA para gerar um resumo estruturado.
    """,
    request=SummarizeJsonInputSerializer, # <-- Serializer específico
    responses={
        200: SummarizeOutputSerializer,
        400: {"description": "Erro de validação (ex: campos faltando)."},
        422: {"description": "Erro ao processar a URL (ex: falha no download)."},
        500: {"description": "Erro interno (ex: falha na IA)."}
    }
)
@api_view(['POST'])
@parser_classes([JSONParser]) # <-- APENAS JSON
def summarize_article_json_view(request):
    """
    Endpoint para resumir um artigo a partir de texto ou URL (JSON).
    """
    serializer = SummarizeJsonInputSerializer(data=request.data)
        
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    validated_data = serializer.validated_data
    input_val = validated_data.get('input_value')
    is_url_val = validated_data.get('is_url', False)
    query = validated_data.get('query', None)
    
    input_type_str = 'url' if is_url_val else 'text'
    
    result = summarize_article(
        input_value=input_val, 
        input_type=input_type_str, 
        natural_language_query=query
    )
    
    return _handle_summarize_response(result)


# --- VIEW 2: RESUMO POR UPLOAD (PDF) ---
@extend_schema(
    summary="[UPLOAD] Resume um Artigo por Upload de PDF",
    description="""Recebe um arquivo PDF via upload (multipart/form-data) 
    e usa IA para gerar um resumo estruturado.
    """,
    
    # --- MUDANÇA PRINCIPAL AQUI ---
    # Vamos definir o schema do request manualmente.
    request={
        # 1. Definimos o 'content-type' que o Swagger deve usar
        'multipart/form-data': {
            'type': 'object',
            # 2. Definimos os campos do formulário
            'properties': {
                'file': {
                    'type': 'string',
                    'format': 'binary'  # <-- A MÁGICA ACONTECE AQUI
                },
                'query': {
                    'type': 'string'
                }
            },
            # 3. Dizemos quais campos são obrigatórios
            'required': ['file']
        }
    },
    # ---------------------------------
    
    responses={
        200: SummarizeOutputSerializer,
        400: {"description": "Erro de validação (ex: arquivo faltando ou formato inválido)."},
        422: {"description": "Erro ao processar o arquivo (ex: PDF corrompido)."},
        500: {"description": "Erro interno (ex: falha na IA)."}
    }
)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def summarize_article_file_view(request):
    """
    Endpoint para resumir um artigo a partir de upload de arquivo PDF.
    """
    # Para FormData, validamos usando o serializer também
    serializer = SummarizeFormInputSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    validated_data = serializer.validated_data
    file_obj = validated_data.get('file')
    query = validated_data.get('query', None) 
    
    if not file_obj.name.lower().endswith('.pdf'):
        return Response(
            {"error": "Formato de arquivo inválido. Por favor, envie um PDF."}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    result = summarize_article(
        input_value=file_obj, 
        input_type='file', 
        natural_language_query=query
    )
    
    return _handle_summarize_response(result)