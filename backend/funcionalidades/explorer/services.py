import os
import json
import requests
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path # Importe a biblioteca Path
from datetime import datetime

env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)


# Configura a API do Google com a chave que está no .env
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def extract_keywords_with_gemini(natural_language_query: str) -> str:
    prompt = f"""
    Você é um assistente de pesquisa especialista em otimizar buscas para o Semantic Scholar. Sua única tarefa é converter a consulta do usuário nos melhores e mais eficazes termos de busca.

    Siga estas regras estritamente:
    1.  **Identifique os Conceitos Principais:** Isole os substantivos e termos técnicos da consulta.
    2.  **Expanda (Português + Inglês):** Para cada conceito principal, inclua o termo original em português E seu equivalente técnico em inglês.
    3.  **Detecte Filtros Específicos:**
        * **Idioma:** Se o usuário especificar um idioma (ex: "em português", "em inglês", "em alemão"), adicione o filtro de idioma do Semantic Scholar (`language:pt`, `language:en`, `language:de`, etc.) à string de busca.
        * **Autor:** Se o usuário mencionar um autor (ex: "do Alan Turing"), adicione o filtro de autor (`author:"Nome do Autor"`).
    4.  **Combine Tudo:** Junte os termos expandidos (PT+EN) e os filtros em uma única string de busca.
    5.  **Formato JSON Obrigatório:** A sua resposta DEVE SER um objeto JSON válido contendo uma única chave chamada "keywords".

    Exemplos:
    -   **Consulta do Usuário:** "inteligencia artificial no futebol"
    -   **Sua Saída:** {{"keywords": "inteligencia artificial IA artificial intelligence futebol soccer football"}}

    -   **Consulta do Usuário:** "inteligencia artificial no futebol EM PORTUGUÊS"
    -   **Sua Saída:** {{"keywords": "inteligencia artificial IA artificial intelligence futebol soccer football language:pt"}}

    -   **Consulta do Usuário:** "artigos do Alan Turing sobre computação em inglês"
    -   **Sua Saída:** {{"keywords": "computação computation author:\"Alan Turing\" language:en"}}

    Processe a seguinte consulta do usuário:
    **Consulta do Usuário:** "{natural_language_query}"
    **Sua Saída:**
    """
    try:
        model = genai.GenerativeModel('gemini-2.5-flash') 
        response = model.generate_content(prompt)
        cleaned_text = response.text.strip().replace('```json', '').replace('```', '')
        data = json.loads(cleaned_text)
        keywords = data['keywords']
        print(f"Termos de busca AVANÇADOS (PT+EN+Filtros) otimizados pelo Gemini: '{keywords}'")
        return keywords
    except (json.JSONDecodeError, KeyError, Exception) as e:
        print(f"Erro ao processar resposta do Gemini: {e}. Usando fallback.")
        return natural_language_query # Fallback para a query original

def search_articles_from_api(query: str, sort_by: str, year_from: int = None, year_to: int = None, offset: int = 0, is_open_access: bool = False):
    """
    Busca artigos com filtros avançados de ordenação, ano, open access e paginação.
    """
    print(f"--- INICIANDO BUSCA AVANÇADA ---")
    print(f"Query: '{query}', Sort: '{sort_by}', Ano: {year_from}-{year_to}, Offset: {offset}, OpenAccess: {is_open_access}")
    
    base_url = "https://api.semanticscholar.org/graph/v1/paper/search"
    api_key = os.getenv("SEMANTIC_API_KEY")
    if not api_key:
        return {"error": "Chave da API do Semantic Scholar não configurada."}

    headers = { 'x-api-key': api_key }
    
    params = {
        'query': query,
        'limit': 20, # O limite de resultados por página
        'offset': offset, # O ponto de início da paginação
        'fields': 'title,authors,year,url,abstract,citationCount,journal'
    }

    # --- LÓGICA DE FILTROS DINÂMICOS ---

    # 1. Ordenação
    if sort_by == 'recency':
        params['sort'] = 'publicationDate:desc'
        print("Filtro aplicado: Mais Recentes")
    elif sort_by == 'relevance':
        params['sort'] = 'citationCount:desc'
        print("Filtro aplicado: Mais Relevantes (Citações)")
    # Se sort_by == 'default', não adicionamos o parâmetro 'sort'
    # e deixamos o Semantic Scholar usar seu algoritmo padrão.
    else:
        print("Filtro aplicado: Relevância da IA (Padrão)")
        
    # 2. Ano
    current_year = datetime.now().year
    start_year = year_from if year_from and year_from > 1900 else 1900
    end_year = year_to if year_to and year_to <= current_year else current_year
    
    if start_year != 1900 or end_year != current_year:
        params['year'] = f"{start_year}-{end_year}"
        print(f"Filtro de ano aplicado: {params['year']}")

    # 3. Open Access
    if is_open_access:
        params['openAccessPdf'] = 'true'
        print("Filtro aplicado: Apenas Open Access")

    try:
        response = requests.get(base_url, params=params, headers=headers, timeout=15)
        response.raise_for_status()
        
        data = response.json()
        
        results = []
        articles_data = data.get('data', [])
        print(f"Total de artigos brutos recebidos da API: {len(articles_data)}")

        if articles_data:
            for item in articles_data:
                if not item.get('abstract'):
                    continue
                
                journal_info = item.get('journal')
                journal_name = journal_info.get('name', 'N/A') if journal_info else 'N/A'
                results.append({
                    'title': item.get('title'),
                    'authors': [author['name'] for author in item.get('authors', [])],
                    'year': item.get('year'),
                    'url': item.get('url'),
                    'abstract': item.get('abstract'),
                    'citationCount': item.get('citationCount', 0),
                    'journal': journal_name
                })
        
        print(f"Total de artigos com resumo: {len(results)}. Retornando TODOS.")
        
        # Retorna todos os resultados encontrados (até o limite de 25)
        return results

    except requests.exceptions.RequestException as e:
        print(f"Erro ao chamar a API do Semantic Scholar: {e}")
        return {"error": "Falha ao se comunicar com a base de dados de artigos."}