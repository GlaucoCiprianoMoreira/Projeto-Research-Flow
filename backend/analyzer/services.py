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

# Modelo Gemini padrão (pode ser sobrescrito por variável de ambiente GEMINI_MODEL)
# Model name constants for convenience
GEMINI_FLASH_2_0 = "gemini-2.0-flash"
GEMINI_FLASH_2_5 = "gemini-2.5-flash"
GEMINI_PRO_2_0 = "gemini-2.0-pro"
GEMINI_PRO_2_5 = "gemini-2.5-pro"

# Default model (can be overridden by environment variable GEMINI_MODEL)
MODEL_NAME = os.getenv("GEMINI_MODEL", GEMINI_PRO_2_5)

def extract_first_json(text: str) -> Optional[str]:
    """Extract the first balanced JSON object from text, ignoring braces inside strings."""
    start = text.find('{')
    if start == -1:
        return None
    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(text)):
        ch = text[i]
        if esc:
            esc = False
            continue
        if ch == '\\':
            esc = True
            continue
        if ch == '"':
            in_str = not in_str
            continue
        if in_str:
            continue
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                return text[start:i+1]
    return None


def call_model(model, prompt_text: str, max_tokens: int = 4096) -> str:
    """Call the generative model with a safe kwargs fallback."""
    try:
        return model.generate_content(prompt_text, temperature=0, max_output_tokens=max_tokens).text
    except TypeError:
        return model.generate_content(prompt_text).text

def extract_pdf_text_from_file(file_input) -> Optional[str]:
    """
    Extrai texto de um arquivo PDF (seja um caminho de arquivo ou um 
    objeto de arquivo/stream).
    Retorna None em caso de falha.
    """
    try:
        # file_input pode ser um caminho (str) ou um stream (like-object)
        reader = PdfReader(file_input)
        
        parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                parts.append(text)
                
        full_text = '\n\n'.join(parts).strip()
        return full_text or None # Retorna None se o texto extraído estiver vazio
        
    except Exception as e:
        print(f"Erro ao ler/extrair PDF do arquivo: {e}")
        return None

def fetch_pdf_text_from_url(url: str) -> Optional[str]:
    """
    Baixa um PDF a partir de uma URL e tenta extrair o texto usando PyPDF2.
    Retorna None em caso de falha.
    """
    tmp_path = None
    try:
        resp = requests.get(url, stream=True, timeout=15)
        resp.raise_for_status()
        ctype = resp.headers.get('content-type', '')
        if 'text/html' in ctype.lower():
            html = resp.text
            m = re.search(r'href=["\']([^"\']+\.pdf)["\']', html, flags=re.IGNORECASE)
            if not m:
                m = re.search(r'href=["\']([^"\']+/pdf/[^"\']+\.pdf)["\']', html, flags=re.IGNORECASE)
            if m:
                resp = requests.get(urllib.parse.urljoin(url, m.group(1)), stream=True, timeout=15)
                resp.raise_for_status()
            elif '/abs/' in url:
                resp = requests.get(url.replace('/abs/', '/pdf/') + ('' if url.endswith('.pdf') else '.pdf'), stream=True, timeout=15)
                resp.raise_for_status()

        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            for chunk in resp.iter_content(chunk_size=8192):
                if chunk:
                    tmp.write(chunk)
            tmp_path = tmp.name

        reader = PdfReader(tmp_path)
        parts = [p.extract_text() or '' for p in reader.pages]
        return '\n\n'.join(parts).strip() or None
    except Exception as e:
        print(f"Erro ao obter/extrair PDF: {e}")
        return None
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass


def summarize_article_with_gemini(article_text: str, natural_language_query: Optional[str] = None) -> dict:
    """
    Envia o texto do artigo para o Gemini e pede um resumo estruturado.

    Retorna um dicionário com as chaves: problem, methodology, results, conclusion
    Em caso de erro, retorna um dicionário com a chave 'error' e mensagem.
    """
    # Limpa/encaixa o prompt para que o modelo retorne apenas JSON
    prompt = """
    Você é um assistente que resume artigos acadêmicos. Sua tarefa é produzir
    um objeto JSON com as seguintes chaves obrigatórias: "problem", "methodology",
    "results", "conclusion". Cada chave deve conter um resumo detalhado sobre o artigo fornecido.

    Regras estritas:
    - Retorne APENAS um objeto JSON válido (Com explicações, mais textos adicionais).
    - Mantenha a linguagem em português e seja objetivo.
    - Faça uma explicação completa e clara para cada seção.
    - Traga também detalhes específicos do artigo, como nomes de métodos, métricas e resultados numéricos.
    - Deve ser feito em português.

    Exemplo de casos de uso:
        **Consulta usuário:** "Resuma o artigo "Attention is all you need" com detalhes técnicos."
        **Sua saída: {
                        "problem": {
                            description: Descreve qual é o problema central abordado pelo artigo e sua relevância dentro do campo de estudo.,
                            context: Apresenta o cenário teórico ou prático em que o problema se insere, incluindo limitações ou lacunas de pesquisas anteriores.,
                            objective: Explica o principal objetivo ou motivação do trabalho — o que os autores buscam resolver ou melhorar.
                        },
                        "methodology": {
                            approach: Resumo do método, modelo ou técnica proposta para resolver o problema.,
                            components: Principais elementos ou etapas da metodologia, como arquitetura, algoritmos, experimentos ou procedimentos analíticos.,
                            data_or_tools: Informações sobre conjuntos de dados, ferramentas, frameworks ou tecnologias utilizadas.,
                            complexity_or_efficiency: Discussão sobre desempenho, custo computacional ou vantagens em relação a métodos anteriores.
                        },
                        results: {
                            datasets_or_experiments: Descrição dos experimentos realizados ou dados analisados.,
                            performance_or_findings: Principais resultados quantitativos e qualitativos, métricas usadas e comparações com abordagens existentes.,
                            interpretation: Análise dos resultados e o que eles indicam em relação ao problema proposto.
                        },
                        conclusion: {
                            summary: Síntese geral das descobertas e contribuições do artigo.,
                            implications: Impactos teóricos, práticos ou futuros da pesquisa.,
                            limitations_or_future_work: Limitações identificadas e direções sugeridas para trabalhos futuros.
                        }
                    }
    """
    consulta = f"""
        Processe a seguinte entrada do usuário:
        **Consulta do Usuário:** "{natural_language_query}"
        **Sua Saída:**
    """
    safe_text = article_text
    full_prompt = f"{prompt}\n{safe_text}\n\nSua saída:"
    model = genai.GenerativeModel(MODEL_NAME)
    # Few-shot (2 exemplos) em português. Cada Saída é APENAS um objeto JSON válido.
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

    # Envia few-shot + prompt
    raw = call_model(model, few_shot + "\n" + full_prompt + consulta)
    cleaned = (raw or '').replace('```json', '').replace('```', '').strip()
    try:
        data = json.loads(cleaned)
    except Exception:
        candidate = extract_first_json(cleaned)
        if not candidate:
            return {"error": "Resposta inválida do modelo de IA.", "raw": (raw or '')[:1000]}
        try:
            data = json.loads(candidate)
        except Exception:
            return {"error": "Resposta inválida do modelo de IA.", "raw": (raw or '')[:1000]}

    # Normalize fields: model may return nested dicts/lists; convert them to readable strings
    def _normalize_field(v):
        if v is None:
            return ''
        if isinstance(v, (dict, list)):
            try:
                return json.dumps(v, ensure_ascii=False)
            except Exception:
                return str(v)
        return str(v).strip()

    return {
        'problem': _normalize_field(data.get('problem')),
        'methodology': _normalize_field(data.get('methodology')),
        'results': _normalize_field(data.get('results')),
        'conclusion': _normalize_field(data.get('conclusion')),
    }
    

def summarize_article(input_value, input_type: str = 'text', natural_language_query: Optional[str] = None) -> dict:
    """
    Wrapper principal para resumir artigos.
    Aceita texto, URL de PDF ou um arquivo/caminho de PDF.

    Args:
        input_value: O conteúdo (texto, URL ou objeto/caminho de arquivo).
        input_type: 'text', 'url' ou 'file'.
        natural_language_query: (Opcional) A consulta específica do usuário.

    Retorna:
        Um dicionário com o resumo ou um dicionário de erro.
    """
    text = None
    
    if input_type == 'url':
        text = fetch_pdf_text_from_url(input_value)
        if not text:
            return {"error": "Falha ao baixar/ler o PDF da URL.", "details": "Não foi possível obter texto a partir da URL fornecida."}
            
    elif input_type == 'file':
        # input_value aqui deve ser o objeto do arquivo (ex: request.files['file'])
        # ou um caminho de arquivo temporário (ex: tmp_path)
        text = extract_pdf_text_from_file(input_value)
        if not text:
            return {"error": "Falha ao ler o arquivo PDF.", "details": "Não foi possível extrair texto do arquivo PDF fornecido."}
            
    elif input_type == 'text':
        text = input_value or ''
        
    else:
        return {"error": "Tipo de entrada (input_type) inválido.", "details": "Use 'text', 'url' ou 'file'."}

    if not text.strip():
        return {"error": "Texto vazio para resumir."}

    # (Eu adicionei o natural_language_query aqui, pois sua função gemini o aceita)
    return summarize_article_with_gemini(text, natural_language_query=natural_language_query)


