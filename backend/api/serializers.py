from rest_framework import serializers

# Serializer para o PEDIDO (o que o front-end envia)
class SearchQuerySerializer(serializers.Serializer):
    """
    Define o formato esperado para a query de busca.
    Ex: {"query": "inteligencia artificial"}
    """
    query = serializers.CharField(
        required=True,
        help_text="A pergunta ou termos de busca em linguagem natural."
    )

# Serializer para a RESPOSTA (o que o backend envia de volta)
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