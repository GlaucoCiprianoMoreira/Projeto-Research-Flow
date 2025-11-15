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

class SummarizeBaseInputSerializer(serializers.Serializer):
    """ Serializer base com o campo comum 'query' """
    query = serializers.CharField(
        help_text="(Opcional) Consulta em linguagem natural para focar o resumo.",
        required=False,
        allow_blank=True
    )

class SummarizeJsonInputSerializer(SummarizeBaseInputSerializer):
    """ 
    Define a entrada para o endpoint de resumo via JSON (texto ou URL).
    """
    input_value = serializers.CharField(
        help_text="O texto completo do artigo OU a URL para o PDF.",
        required=True
    )
    is_url = serializers.BooleanField(
        default=False,
        help_text="Marque True se 'input_value' for uma URL; False se for texto."
    )

class SummarizeFormInputSerializer(SummarizeBaseInputSerializer):
    """
    Define a entrada para o endpoint de resumo via FormData (upload de arquivo).
    """
    file = serializers.FileField(
        required=True,
        help_text="Upload de um arquivo PDF para ser resumido."
    )
    # Nota: Os outros campos (como 'query') também virão como FormData.

class SummarizeOutputSerializer(serializers.Serializer):
    problem = serializers.CharField(allow_blank=True, help_text="O problema abordado pelo artigo.")
    methodology = serializers.CharField(allow_blank=True, help_text="A metodologia utilizada.")
    results = serializers.CharField(allow_blank=True, help_text="Os resultados encontrados.")
    conclusion = serializers.CharField(allow_blank=True, help_text="A conclusão do artigo.")
    error = serializers.CharField(allow_blank=True, required=False, help_text="Mensagem de erro, se houver.")