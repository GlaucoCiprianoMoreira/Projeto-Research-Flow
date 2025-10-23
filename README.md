#Explorer
Módulo de Busca (explorer)
Este app é o "cérebro" por trás da funcionalidade de busca de artigos. Sua responsabilidade é receber uma consulta do usuário, processá-la com Inteligência Artificial e buscar os resultados em bases de dados acadêmicas.

Fluxo da Funcionalidade de Busca
O processo é orquestrado pela view search_articles_view (localizada em api/views.py) e executado pelos serviços deste app:

A API recebe uma consulta em linguagem natural (ex: "artigos sobre IA no futebol em português").

A consulta é enviada para a função extract_keywords_with_gemini.

O Gemini (IA) analisa a consulta e a enriquece, gerando uma "super-query" que inclui:

Termos em Português (ex: futebol).

Termos em Inglês (ex: soccer, football).

Filtros de intenção, se detectados (ex: language:pt ou author:"Nome").

A "super-query" resultante é passada para a função search_articles_from_api.

Esta função se conecta à API do Semantic Scholar, busca pelos termos e solicita os 25 artigos mais relevantes.

Os resultados brutos são filtrados: artigos sem resumo (abstract) são descartados.

Os artigos restantes são classificados pelo número de citações (citationCount), do maior para o menor.

Os Top 5 artigos "mais bem avaliados" dessa lista são selecionados.

A view da API formata esses 5 artigos em uma resposta carismática (JSON), que inclui uma mensagem de sucesso e a lista de artigos.

Componentes Principais
explorer/services.py
Este arquivo contém toda a lógica de negócios da busca.

extract_keywords_with_gemini(natural_language_query)

Propósito: Interface com a API do Google Gemini.

Lógica: Usa um prompt de engenharia avançada para converter uma frase simples em uma string de busca otimizada (híbrida PT/EN + filtros).

Saída: Uma string de busca formatada em JSON ({"keywords": "..."}).

search_articles_from_api(query)

Propósito: Interface com a API do Semantic Scholar.

Lógica: Busca os artigos usando a query fornecida, aplica os filtros de qualidade (resumo) e a lógica de classificação (top 5 por citações).

Saída: Uma lista de até 5 objetos de artigo formatados.

api/serializers.py
SearchQuerySerializer: Define o "contrato" da requisição. Garante que a API receba um JSON com a chave query.

ArticleSerializer: Define o "contrato" de cada artigo na resposta, garantindo um formato consistente.

ApiResponseSerializer: Define o "contrato" da resposta final da API, incluindo as chaves success, message e articles.

api/views.py
search_articles_view

É o ponto de entrada da API (POST /api/search/).

Valida os dados de entrada usando o SearchQuerySerializer.

Orquestra a chamada para extract_keywords_with_gemini e search_articles_from_api.

Constrói e retorna a resposta final usando o ApiResponseSerializer.

Configuração de Ambiente
Para que este módulo funcione, o arquivo .env (localizado na raiz do projeto reserach-flow-backend/) deve conter as seguintes chaves:

# Chave para a API do Google AI Studio (Gemini)
GOOGLE_API_KEY="Está no .venv"

# Chave para a API do Semantic Scholar
SEMANTIC_API_KEY="Está no .venv"
Documentação Interativa (Swagger)

A documentação completa deste endpoint, incluindo como testá-lo interativamente, está disponível no Swagger da API, que roda junto com o servidor.

URL: http://127.0.0.1:8000/api/schema/swagger-ui/ 
