# *Explorer*

O **Explorer** é o cérebro por trás da funcionalidade de **busca de artigos acadêmicos** no sistema **Research Flow**.  
Sua principal responsabilidade é **receber consultas em linguagem natural**, processá-las com **Inteligência Artificial (Gemini)** e **buscar resultados relevantes** em bases científicas, como o **Semantic Scholar**.

---

##  Visão Geral do Fluxo de Busca

O processo completo é orquestrado pela view `search_articles_view` (localizada em `api/views.py`) e executado pelos serviços deste app:

1.  **Recepção da Consulta**  
   A API recebe uma consulta em linguagem natural (exemplo:  
   `"artigos sobre IA no futebol em português"`).

2.  **Extração e Enriquecimento de Palavras-Chave**  
   A consulta é enviada para a função `extract_keywords_with_gemini`.

   - O **Gemini** analisa o texto e gera uma **super-query** aprimorada, contendo:
     - Termos em **Português** (`futebol`);
     - Termos em **Inglês** (`soccer`, `football`);
     - **Filtros inteligentes**, se detectados (ex: `language:pt` ou `author:"Nome"`).

3.  **Busca em Base de Dados Acadêmica**  
   A “super-query” é passada para a função `search_articles_from_api`, que:
   - Se conecta à **API do Semantic Scholar**;
   - Recupera os **25 artigos mais relevantes**;
   - Descarta artigos **sem resumo (abstract)**;
   - Ordena os resultados pelo número de **citações** (`citationCount`);
   - Seleciona os **Top 5 artigos mais bem avaliados**.

4. **Formatação da Resposta Final**  
   A view monta a resposta no formato JSON, com:
   - ✅ `success`: status da operação;
   - 💬 `message`: mensagem amigável;
   - 📚 `articles`: lista dos artigos formatados.

---

##  Estrutura dos Componentes Principais

###  `explorer/services.py`

Contém **toda a lógica de negócios** da busca.

####  `extract_keywords_with_gemini(natural_language_query)`
- **Propósito:** Interface com a API do **Google Gemini**.  
- **Lógica:**  
  Usa *prompt engineering* avançado para converter uma consulta simples em uma **query híbrida PT/EN otimizada**, adicionando filtros de intenção.  
- **Saída:**  
  JSON no formato:
  ```json
  { "keywords": "..." }
  ```

####  `search_articles_from_api(query)`
- **Propósito:** Interface com a API do **Semantic Scholar**.  
- **Lógica:**
  - Executa a busca com a query gerada;
  - Aplica filtros de qualidade (descarta artigos sem resumo);
  - Ordena por número de citações;
  - Retorna os **Top 5** artigos mais relevantes.
- **Saída:**  
  Lista de objetos de artigos formatados.

---

###  `api/serializers.py`

Define o **contrato de dados** da API — garantindo consistência entre requisição e resposta.

####  `SearchQuerySerializer`
- Valida o JSON de entrada, garantindo que contenha a chave:
  ```json
  { "query": "..." }
  ```

####  `ArticleSerializer`
- Define o formato de cada artigo retornado (título, autores, resumo, citações, etc).

####  `ApiResponseSerializer`
- Estrutura a resposta final, com:
  ```json
  {
    "success": true,
    "message": "Busca concluída com sucesso!",
    "articles": [...]
  }
  ```

---

###  `api/views.py`

####  `search_articles_view`
O **ponto de entrada da API**: `POST /api/search/`

**Fluxo interno:**
1. Valida os dados com `SearchQuerySerializer`;
2. Chama `extract_keywords_with_gemini`;
3. Executa `search_articles_from_api`;
4. Formata o retorno com `ApiResponseSerializer`.

>  As chaves são mantidas seguras no ambiente virtual `.venv`.


##  Tecnologias Envolvidas

| Tecnologia | Função |
|-------------|--------|
| **Python / Django REST Framework** | Backend e estrutura da API |
| **Google Gemini API** | Processamento de linguagem natural e enriquecimento semântico |
| **Semantic Scholar API** | Fonte de dados acadêmicos |
| **Swagger UI** | Documentação e testes interativos da API |

---

##  Resultado Esperado (Exemplo)

```json
{
  "success": true,
  "message": "Top 5 artigos encontrados com sucesso!",
  "articles": [
    {
      "title": "Artificial Intelligence in Football Analytics",
      "authors": ["John Doe", "Jane Smith"],
      "abstract": "This paper explores the use of AI in analyzing soccer performance...",
      "citationCount": 125
    }
  ]
}
```

---


# Analyzer — Explorer

> Documento estilo *explorer* que descreve o módulo **Analyzer** (Resumo de artigos científicos). Objetivo: servir como referência para desenvolvedores e documentação rápida para revisão de código.

---

## 📂 Visão geral

O **Analyzer** recebe artigos científicos via **URL** (link) ou **PDF** (upload). Ele extrai o texto (até **50.000 caracteres**), combina com a *query* do usuário e envia para o serviço de IA generativa (Gemini) para produzir um resumo estruturado em JSON.

**Formato de saída desejado (JSON):**

```json
{
  "problem": "...",
  "methodology": "...",
  "results": "...",
  "conclusion": "..."
}
```

Linguagem: **Português**. Objetivo: objetividade e detalhes (métodos, métricas, valores numéricos).

---

## 🚦 Fluxo da funcionalidade (passo a passo)

1. Cliente faz requisição para a API com: **artigo (URL ou PDF)** + **query** (texto simples).
2. `api/views.py` escolhe entre:

   * `summarize_article_json_view` (URL / JSON)
   * `summarize_article_file_view` (upload / FormData)
3. `analyzer.services.summarize_article` orquestra o fluxo: valida entrada, invoca extração e prepara payload.
4. Extração do texto:

   * `fetch_pdf_text_from_url(url)` — baixa PDF e extrai (PyPDF2)
   * `extract_pdf_text_from_file(file_or_path)` — extrai texto de arquivo/stream
   * Caso o artigo seja uma URL com HTML, a função faz *fetch* do HTML e extrai texto (optionally)
5. Limita o texto a **50.000 caracteres** (corte com cuidado - preferir resumo de seções iniciais/abstract/métodos/resultados).
6. `summarize_article_with_gemini` monta o prompt (regras estritas + few-shot + user query + trecho do artigo)
7. `call_model` chama `genai.generate_content` com os campos corretos e retorna o JSON.
8. Resultado é retornado ao front-end e gravado (opcional) em cache / banco.

---

## 🧩 Principais componentes (arquivos e responsabilidades)

* **analyzer/services.py**

  * `summarize_article(request_data)` — orquestra o processo e decide fluxo URL vs PDF.
  * `summarize_article_with_gemini(user_query, article_text)` — monta prompt + few-shot + limita texto.
  * `call_model(prompt_payload)` — chama Gemini (`genai.generate_content`) e normaliza a resposta.
  * `extract_pdf_text_from_file(file_or_path)` — extrai texto de PDF, retorna `str` ou `None`.
  * `fetch_pdf_text_from_url(url)` — baixa e extrai texto de PDF remoto.

* **api/views.py**

  * `summarize_article_json_view(request)` — aceita JSON com `url` ou `text` e `query`.
  * `summarize_article_file_view(request)` — aceita FormData com `file` (PDF) e `query`.

* **api/serializers.py**

  * `SummarizeBaseInputSerializer` — campo `query` (opcional).
  * `SummarizeJsonInputSerializer` — recebe `url` ou `text` e `query`.
  * `SummarizeFormInputSerializer` — recebe `file` (PDF) e `query`.

---

## ✏️ Prompt e few-shot (exemplo)

**Regras estritas (resumidas):**

* Retornar **APENAS** um objeto JSON válido.
* Linguagem: **Português**, seja objetivo.
* Explique completa e claramente cada seção.
* Inclua detalhes específicos (nomes de métodos, métricas, resultados numéricos).

**Few-shot (exemplo simplificado):**

```
Entrada: "Rede neural convolucional leve para classificação de imagens; testes em CIFAR-10 atingiram 92 porcento de acurácia com menor custo computacional."
Saída: {"problem": "Necessidade de classificar imagens com eficiência computacional.", "methodology": "Arquitetura CNN leve otimizada para reduzir parâmetros.", "results": "Acurácia de 92 porcento em CIFAR-10 com redução de parâmetros.", "conclusion": "Bom trade-off entre desempenho e custo computacional."}
```

**Montagem do payload para Gemini:**

* `model`: `genai.GenerativeModel` configurado pela aplicação
* `prompt`: regras + instruções (muito curtas e diretas)
* `few_shot`: string de exemplos
* `user_query`: a consulta original do usuário (sem enriquecimento)
* `article_text`: até 50.000 caracteres do artigo

---

## 🛠️ Boas práticas e decisões de implementação

* **Limitar texto a 50k chars**: preferir extrair abstract, introdução, métodos e resultados em ordem, não apenas cortar do começo ao fim.
* **Validação**: checar tipo de arquivo, tamanho e se há texto extraído; retornar erros claros (HTTP 400/422).
* **Timeouts e retries**: colocar timeout ao chamar Gemini e políticas simples de retry (exp/backoff) no `call_model`.
* **Normalização do output**: validar que a resposta é JSON, desserializar com `json.loads` e validar campos obrigatórios (`problem`, `methodology`, `results`, `conclusion`).
* **Segurança**: sanitizar inputs de URL; não executar HTML/JS; limitar tamanho de upload.

---

## 🧪 Tratamento de falhas comuns

* *Extração falhou (None)*: retornar mensagem de erro com sugestão — "não foi possível extrair texto do PDF; verifique o arquivo ou envie o link."
* *Resposta do modelo não é JSON válida*: tentar limpar ruído com regex (tentar extrair o primeiro objeto JSON) e, se falhar, retornar erro 502 com o conteúdo bruto para análise.
* *Conteúdo muito longo*: avisar que só foram usados os primeiros 50k caracteres e possivelmente oferecer opção de resumo por seção.

---

## ✅ Exemplo rápido de uso (requests)

**JSON (URL/text):**

```
POST /api/summarize/json
Content-Type: application/json

{
  "url": "https://exemplo.org/artigo.pdf",
  "query": "Resuma os métodos e resultados, com foco em métricas de acurácia e datasets usados."
}
```

**FormData (upload):**

```
POST /api/summarize/file
Content-Type: multipart/form-data

file=@artigo.pdf
query="Explique em português os métodos e resultados, com números."
```

---


## ⚙️ Configuração de Ambiente

Para que o módulo funcione corretamente, o arquivo `.env` (na raiz do projeto `research-flow-backend/`) deve conter as seguintes chaves:

```bash
# 🔑 Chave da API do Google AI Studio (Gemini)
GOOGLE_API_KEY="Está no .venv"

# 🔑 Chave da API do Semantic Scholar
SEMANTIC_API_KEY="Está no .venv"
```


## 📘 Documentação Interativa (Swagger)

A documentação completa deste endpoint, incluindo testes interativos, está disponível via **Swagger UI**.

- **URL:** [http://127.0.0.1:8000/api/schema/swagger-ui/](http://127.0.0.1:8000/api/schema/swagger-ui/)

---
