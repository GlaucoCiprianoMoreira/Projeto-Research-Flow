import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
import requests
import tempfile
import re
from typing import Optional
from PyPDF2 import PdfReader
import urllib.parse

# Carrega as variáveis do arquivo .env para o ambiente
load_dotenv()

# Configura a API do Google com a chave que está no .env
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def extract_keywords_with_gemini(natural_language_query: str) -> str:
    """
    Usa a IA do Gemini para extrair os termos de busca de uma frase.
    """
    prompt = f"""
    Você é um processador de linguagem natural para um motor de busca acadêmico. Sua única função é converter uma consulta de usuário em uma string de palavras-chave otimizada para uma API de pesquisa como a do Semantic Scholar.

    Siga estas regras estritamente:
    1.  **Analise a Intenção:** Identifique os conceitos, tecnologias, substantivos e termos técnicos principais na consulta do usuário.
    2.  **Remova o Ruído:** Descarte completamente todos os elementos conversacionais.
    3.  **Mantenha a Essência:** Preserve apenas os termos que são cruciais para a busca.
    4.  **Formato de Saída Obrigatório:** A sua resposta DEVE SER um objeto JSON válido contendo uma única chave chamada "keywords". O valor dessa chave será a string com as palavras-chave processadas, em minúsculas e separadas por espaços. Não inclua NENHUM texto fora deste objeto JSON.

    Exemplos de Casos de Uso:
    -   **Consulta do Usuário:** "me encontre, por favor, artigos recentes sobre o impacto da inteligência artificial na economia do Brasil"
    -   **Sua Saída:** {{"keywords": "impacto inteligência artificial economia brasil"}}

    -   **Consulta do Usuário:** "história da computação quântica"
    -   **Sua Saída:** {{"keywords": "história computação quântica"}}

    Processe a seguinte consulta do usuário:
    **Consulta do Usuário:** "{natural_language_query}"
    **Sua Saída:**
    """
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(prompt)
        cleaned_text = response.text.strip().replace('```json', '').replace('```', '')
        data = json.loads(cleaned_text)
        keywords = data['keywords']
        print(f"Keywords extraídas pelo Gemini (via JSON): '{keywords}'")
        return keywords
    except (json.JSONDecodeError, KeyError, Exception) as e:
        print(f"Erro ao processar resposta do Gemini: {e}. Usando fallback.")
        return natural_language_query.lower()

def search_articles_from_api(query: str):
    """
    Busca artigos na API do Semantic Scholar usando as palavras-chave fornecidas.
    """
    print(f"Buscando artigos REAIS no Semantic Scholar para: '{query}'")

    # Endereço base da API do Semantic Scholar
    base_url = "https://api.semanticscholar.org/graph/v1/paper/search"

    # Parâmetros da nossa busca
    params = {
        'query': query,
        'limit': 10,  # Quantos artigos queremos de volta? 10 é um bom número.
        'fields': 'title,authors,year,url,abstract,citationCount,journal' # Quais dados queremos de cada artigo?
    }

    try:
        # Faz a requisição GET para a API
        response = requests.get(base_url, params=params, timeout=10) # Timeout de 10 segundos
        response.raise_for_status()  # Lança um erro se a resposta for mal-sucedida (ex: 404, 500)

        data = response.json()

        # Formata a resposta da API para ser mais limpa e útil para o front-end
        results = []
        if data.get('data'):
            for item in data['data']:
                # Ignora artigos que não têm um resumo, pois eles não são muito úteis para nós
                if not item.get('abstract'):
                    continue

                results.append({
                    'title': item.get('title'),
                    'authors': [author['name'] for author in item.get('authors', [])],
                    'year': item.get('year'),
                    'url': item.get('url'),
                    'abstract': item.get('abstract'),
                    'citationCount': item.get('citationCount'),
                    'journal': item.get('journal', {}).get('name', 'N/A') # Tratamento para caso não tenha journal
                })
        return results

    except requests.exceptions.RequestException as e:
        print(f"Erro ao chamar a API do Semantic Scholar: {e}")
        # Se a API externa falhar, retornamos um erro claro para o front-end
        return {"error": "Falha ao se comunicar com a base de dados de artigos. Tente novamente mais tarde."}


def fetch_pdf_text_from_url(url: str) -> Optional[str]:
    """
    Baixa um PDF a partir de uma URL e tenta extrair o texto usando PyPDF2.
    Retorna None em caso de falha.
    """
    tmp_path = None
    try:
        resp = requests.get(url, stream=True, timeout=15)
        resp.raise_for_status()

        # Se o servidor retornou HTML (ex: página de abstract do arXiv),
        # tentamos descobrir um link direto para o PDF e seguir para ele.
        content_type = resp.headers.get('content-type', '')
        if 'text/html' in content_type.lower():
            try:
                html = resp.text
                # procura por href que termina em .pdf
                m = re.search(r'href=["\']([^"\']+\.pdf)["\']', html, flags=re.IGNORECASE)
                if not m:
                    # procura links comuns do arXiv: /pdf/<id>.pdf
                    m = re.search(r'href=["\']([^"\']+/pdf/[^"\']+\.pdf)["\']', html, flags=re.IGNORECASE)
                if m:
                    pdf_href = m.group(1)
                    pdf_url = urllib.parse.urljoin(url, pdf_href)
                    # substitui resp pelo download do PDF
                    resp = requests.get(pdf_url, stream=True, timeout=15)
                    resp.raise_for_status()
                else:
                    # tenta construir URL padrão para arXiv (substitui /abs/ -> /pdf/)
                    if '/abs/' in url and url.endswith('/') is False:
                        pdf_url = url.replace('/abs/', '/pdf/') + '.pdf' if not url.endswith('.pdf') else url
                        resp = requests.get(pdf_url, stream=True, timeout=15)
                        resp.raise_for_status()
            except Exception:
                # se não achar PDF na página, deixamos prosseguir e lidar com erro ao salvar
                pass

        # Salva em um arquivo temporário (fechado quando sair do with)
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            for chunk in resp.iter_content(chunk_size=8192):
                if chunk:
                    tmp.write(chunk)
            tmp_path = tmp.name

        # Extrai texto com PyPDF2 (abre depois do with — evita locks no Windows)
        reader = PdfReader(tmp_path)
        text_parts = []
        for page in reader.pages:
            try:
                text_parts.append(page.extract_text() or "")
            except Exception:
                # ignore extraction errors on a single page
                continue

        full_text = "\n\n".join(text_parts).strip()
        if not full_text:
            return None
        return full_text

    except requests.RequestException as e:
        print(f"Erro ao baixar PDF: {e}")
        return None
    except Exception as e:
        print(f"Erro ao extrair texto do PDF: {e}")
        return None
    finally:
        # Remover o arquivo temporário quando existir
        try:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception as e:
            # Não interromper o fluxo por falha na remoção, apenas logue
            print(f"Aviso: falha ao remover arquivo temporário {tmp_path}: {e}")


def summarize_article_with_gemini(article_text: str) -> dict:
    """
    Envia o texto do artigo para o Gemini e pede um resumo estruturado.

    Retorna um dicionário com as chaves: problem, methodology, results, conclusion
    Em caso de erro, retorna um dicionário com a chave 'error' e mensagem.
    """
    # Limpa/encaixa o prompt para que o modelo retorne apenas JSON
    prompt = f"""
    Você é um assistente que resume artigos acadêmicos. Sua tarefa é produzir
    um objeto JSON com as seguintes chaves obrigatórias: "problem", "methodology",
    "results", "conclusion". Cada valor deve ser um texto sucinto (1-4 sentenças).

    Regras estritas:
    - Retorne APENAS um objeto JSON válido (Com explicações, mais textos adicionais).
    - Mantenha a linguagem em português e seja didático.
    - Faça uma explicação completa e clara para cada seção.


    Artigo (trecho ou texto completo):
    """
    # Se o texto for muito grande, truncamos para um tamanho seguro (por ex. 12000 caracteres)
    safe_text = article_text
    if len(safe_text) > 12000:
        safe_text = safe_text[:12000]

    full_prompt = f"{prompt}\n{safe_text}\n\nSua saída:" 

    try:
        model = genai.GenerativeModel('gemini-2.0-flash')

        # Helper para chamar o modelo; configuramos temperature=0 para respostas determinísticas
        def call_model(prompt_text: str):
            try:
                return model.generate_content(prompt_text, temperature=0, max_output_tokens=1500).text
            except TypeError:
                # fallback se a assinatura não aceitar os kwargs
                return model.generate_content(prompt_text).text

        raw_response = None
        data = None
        # Tentativas: primeira solicitação, depois re-prompt estrito se necessário
        for attempt in range(2):
            raw_response = call_model(full_prompt if attempt == 0 else (
                "Você não retornou um JSON válido. Responda APENAS com um objeto JSON válido contendo as chaves: \"problem\", \"methodology\", \"results\", \"conclusion\". "
                "Não inclua nenhum texto adicional nem explicações. Apenas o objeto JSON.\n\n" + full_prompt
            ))

            cleaned = raw_response.strip()
            print(f"[DEBUG] Gemini raw response (attempt {attempt+1}):\n{cleaned[:1000]}")

            # Remove blocos de código se houver
            cleaned_json_candidate = cleaned.replace('```json', '').replace('```', '').strip()

            try:
                data = json.loads(cleaned_json_candidate)
                break
            except json.JSONDecodeError:
                # Try to salvage a JSON object substring from the response
                try:
                    start = cleaned.find('{')
                    end = cleaned.rfind('}')
                    if start != -1 and end != -1 and end > start:
                        candidate = cleaned[start:end+1]
                        data = json.loads(candidate)
                        break
                except Exception:
                    data = None
                    # continue to next attempt
                    continue

        if not data:
            # Fornecemos parte da resposta bruta para debug (truncada)
            raw_excerpt = (raw_response or '')[:1000]
            print(f"Erro: não foi possível obter JSON válido do Gemini. Resposta bruta: {raw_excerpt}")
            return {"error": "Resposta inválida do modelo de IA.", "raw": raw_excerpt}

        # Garante que as chaves existam
        result = {
            'problem': (data.get('problem') or '').strip(),
            'methodology': (data.get('methodology') or '').strip(),
            'results': (data.get('results') or '').strip(),
            'conclusion': (data.get('conclusion') or '').strip(),
        }
        print(f"Resumo gerado com sucesso pelo Gemini: {list(result.keys())}")
        return result

    except (json.JSONDecodeError, KeyError) as e:
        print(f"Erro ao decodificar JSON do Gemini: {e}")
        return {"error": "Resposta inválida do modelo de IA."}
    except Exception as e:
        print(f"Erro ao chamar Gemini para resumir: {e}")
        return {"error": "Falha ao gerar resumo com a IA."}
    

