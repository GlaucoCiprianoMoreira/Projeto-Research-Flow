from rest_framework import serializers

# --- Serializers da Busca ---

# Em api/serializers.py

class SearchQuerySerializer(serializers.Serializer):
    """
    Define o formato esperado para a query de busca.
    """
    query = serializers.CharField(
        required=True,
        help_text="A pergunta ou termos de busca em linguagem natural."
    )
    sort_by = serializers.CharField(
        required=False, 
        # MUDANÇA: O novo padrão é 'default' (Relevância da IA)
        default="default", 
        help_text="Critério de ordenação: 'default' (IA), 'relevance' (citações) ou 'recency' (data)."
    )
    year_from = serializers.IntegerField(
        required=False, 
        allow_null=True, 
        help_text="Ano inicial do filtro."
    )
    year_to = serializers.IntegerField(
        required=False, 
        allow_null=True, 
        help_text="Ano final do filtro."
    )
    # --- NOVOS CAMPOS ADICIONADOS ---
    offset = serializers.IntegerField(
        required=False, 
        default=0,
        help_text="Índice inicial para paginação (ex: 0, 25, 50...)."
    )
    is_open_access = serializers.BooleanField(
        required=False, 
        default=False,
        help_text="Filtrar apenas por artigos com PDF gratuito."
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

# --- Serializers do Formatador ---

class FormatTextSerializer(serializers.Serializer):
    """
    Serializer mínimo para upload via multipart/form-data.
    - file: o arquivo enviado (pdf ou txt)
    - style: (opcional) nome do estilo a ser aplicado
    - filename: (opcional) sugestão de nome base para os arquivos gerados
    """
    file = serializers.FileField(required=True, help_text="Upload do arquivo (.pdf ou .txt).")
    style = serializers.CharField(required=False, allow_blank=True, help_text="Nome do estilo (ex: 'AAAI').")
    filename = serializers.CharField(required=False, allow_blank=True, help_text="Nome base para salvar arquivos (sem extensão).")


class FewshotInputSerializer(serializers.Serializer):
    """
    Opcional: se você expõe endpoint para gerar few-shot baseado em 'style'.
    """
    style = serializers.CharField(required=True, help_text="Nome do estilo/conferência (ex: 'AAAI').")

class FormatTextOutputSerializer(serializers.Serializer):
    """
    Resposta padrão para requests de formatação.
    """
    success = serializers.BooleanField()
    message = serializers.CharField(allow_blank=True)
    tex_path = serializers.CharField(allow_blank=True, required=False,
                                     help_text="Caminho do arquivo .tex gerado (no servidor).")
    pdf_path = serializers.CharField(allow_blank=True, required=False,
                                     help_text="Caminho do arquivo .pdf gerado (no servidor).")
    error = serializers.CharField(allow_blank=True, required=False)
