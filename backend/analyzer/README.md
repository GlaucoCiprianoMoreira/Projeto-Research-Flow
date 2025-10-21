Módulo de Resumo (analyzer):
Esse módulo traz a funcionalidade de resumo de artigos científicos entregues pelo usuário. O Analyzer é responsável por receber os artigos tanto em formato de URL (recebendo o link do site que está disponível o artigo) quanto via PDF fazendo o upload do arquivo. Em seguida, a ferramenta armazena os textos (até 50000 caracteres) presentes do site ou PDF e essa variável é utilizada pelo prompt de IA generativa do Gemini para gerar resumos.

Fluxo da Funcionalidade de Resumo:

O Processo é organizado pelos métodos summarize_article_file_view ou summarize_article_json_view (localizados em api/views.py) a depender do que foi escolhido pelo usuário, se ele entregou o artigo via URL ou via PDF.

Além do artigo, a API também recebe uma consulta (query) em linguagem natural para passar à IA generativa o que o usuário deseja.

Essa consulta do usuário é entregue à API através do método summarize_article_with_gemini. A consulta é entregue para a API de maneira simples, sem enriquecimento.

Para suprir esse problema de não enriquecimento da query, foi adicionado/especificado um prompt com alguns aspectos que o resumo deve cobrir como:
Regras estritas:
    - Retorne APENAS um objeto JSON válido (Com explicações, mais textos adicionais).
    - Mantenha a linguagem em português e seja objetivo.
    - Faça uma explicação completa e clara para cada seção.
    - Traga também detalhes específicos do artigo, como nomes de métodos, métricas e resultados numéricos.

Foi feito um few-shot até então simples, para que a API entenda melhor o formato de resposta que desejamos retornar ao usuário.
few_shot = """
    Entrada: ""Rede neural convolucional leve para classificação de imagens; testes em CIFAR-10 atingiram 92 porcento de acurácia com menor custo computacional.""
    Saída:
    {"problem": "Necessidade de classificar imagens com eficiência computacional.", "methodology": "Arquitetura CNN leve otimizada para reduzir parâmetros.", "results": "Acurácia de 92 porcento em CIFAR-10 com redução de parâmetros.", "conclusion": "Bom trade-off entre desempenho e custo computacional."}

    Geral:
    Entrada: "artigo + consulta do usuário"
    Saída:
    {"problem": "...", 
    "methodology": "...", 
    "results": "...", 
    "conclusion": "..."}
"""

O resultado da API deve ser um JSON com as areas de problema, metodologia, resultados e conclusão para que o resumo do artigo seja melhor dividido em suas respectivas áreas.

O generate_content da API do gemini recebe então: model (genai.GenerativeModel), pequeno prompt (Com as regras estritas), few-shot, query de consulta do usuário e artigo (limtado até 50000 caracteres para não exigir muitos tokens).

Principais componentes para o funcionamento ideal da ferramenta:

analyzer/services.py: responsável por organizar e executar toda a lógica de negócio da funcionalidade de resumo de artigos. Recebe a consulta e o artigo para então serem trabalhados.

    summarize_article: responsável por orquestrar o recebimento de informações do views.py e verificar ser o artigo foi entrege em URL ou PDF, para então chamar os métodos necessários e por fim retornar o summarize_article_with_gemini

    summarize_article_with_gemini: quem gera o prompt de aspectos gerais exigidos, cria o few_shot, limita os caracteres do artigo passados para a API e recebe a consulta do usuário. Por fim, junta todas essas informações e passa para o call_model.

    call_model: responsável por chamar o método generate_content da API do Gemini corretamente. Gera o resultado/resumo propriamente dito, que é em seguida retornado para o front-end e entregue ao usuário.

    extract_pdf_text_from_file: Extrai texto de um arquivo PDF (seja um caminho de arquivo ou um 
    objeto de arquivo/stream). Retorna None em caso de falha.

    fetch_pdf_text_from_url: Baixa um PDF a partir de uma URL e tenta extrair o texto usando PyPDF2. Retorna None em caso de falha.

api/serializers.py: contém as funções de recebimento de informações entregues pelo usuário.

SummarizeBaseInputSerializer: Define o campo comum query, que permite uma consulta opcional em linguagem natural para direcionar o foco do resumo.

SummarizeJsonInputSerializer: Usado quando a entrada vem em JSON (Texto por escrito ou URL).

SummarizeFormInputSerializer: Usado quando a entrada vem via FormData (upload).
    Recebe:
    file: o arquivo PDF a ser resumido.



Configuração de Ambiente
Para que este módulo funcione, o arquivo .env (localizado na raiz do projeto reserach-flow-backend/) deve conter as seguintes chaves:

# Chave para a API do Google AI Studio (Gemini)
GOOGLE_API_KEY="Está no .venv"

# Chave para a API do Semantic Scholar
SEMANTIC_API_KEY="Está no .venv"
Documentação Interativa (Swagger)

A documentação completa deste endpoint, incluindo como testá-lo interativamente, está disponível no Swagger da API, que roda junto com o servidor.

URL: http://127.0.0.1:8000/api/schema/swagger-ui/