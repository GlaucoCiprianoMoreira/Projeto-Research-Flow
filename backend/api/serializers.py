from rest_framework import serializers

# --- Serializers da Busca ---

class SearchQuerySerializer(serializers.Serializer):
    """
    Define o formato esperado para a query de busca.
    Ex: {"query": "inteligencia artificial"}
    """
    query = serializers.CharField(
        required=True,
        help_text="A pergunta ou termos de busca em linguagem natural."
    )

class ArticleSerializer(serializers.Serializer):
    """
    Define a estrutura de um único artigo na lista de resultados.
    """
    title = serializers.CharField()
    authors = serializers.ListField(child=serializers.CharField())
    year = serializers.IntegerField(allow_null=True)
    url = serializers.URLField()
    abstract = serializers.CharField(allow_null=True)
    citationCount = serializers.IntegerField()
    journal = serializers.CharField(allow_null=True)


class ApiResponseSerializer(serializers.Serializer):
    """
    Define o formato padrão de resposta carismática da API.
    """
    success = serializers.BooleanField(help_text="Indica se a operação foi bem-sucedida.")
    message = serializers.CharField(help_text="Uma mensagem amigável para o usuário.")
    articles = ArticleSerializer(many=True, help_text="A lista de artigos encontrados.")


# --- Serializers do Resumo ---

class SummarizeInputSerializer(serializers.Serializer):
    """
    Define o formato de entrada para o endpoint de resumo.
    """
    input_value = serializers.CharField(
        help_text="O texto completo do artigo OU a URL para o PDF."
    )
    is_url = serializers.BooleanField(
        default=False,
        help_text="Marque True se 'input_value' for uma URL; False se for texto."
    )

class SummarizeOutputSerializer(serializers.Serializer):
    """
    Define o formato de saída do resumo estruturado.
    """
    problem = serializers.CharField(allow_blank=True, help_text="O problema abordado pelo artigo.")
    methodology = serializers.CharField(allow_blank=True, help_text="A metodologia utilizada.")
    results = serializers.CharField(allow_blank=True, help_text="Os resultados encontrados.")
    conclusion = serializers.CharField(allow_blank=True, help_text="A conclusão do artigo.")
    # Usado para enviar mensagens de erro do backend
    error = serializers.CharField(allow_blank=True, required=False, help_text="Mensagem de erro, se houver.")