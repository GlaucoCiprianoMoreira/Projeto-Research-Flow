import os
import json
from dotenv import load_dotenv
import google.generativeai as genai
from pathlib import Path
import pylatex
from typing import Optional
from PyPDF2 import PdfReader
import google.generativeai as genai
from pylatex import Document, Section, Subsection, Command
from pylatex.utils import NoEscape


load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def decide_fewshot(style: str) -> str:
    """
    Criação de few-shot em tempo real. Gemini recebe o nome do estilo e gera um fewshot com exemplo de como deve ser
    seguida a formatação do artigo.
    """
    prompt = f"""
        Inicialmente, descreva o estilo da conferência {style} em poucas palavras (focando em suas regras/exigências).
        Em seguinda:
        Você é um assistente de formatação de texto para o formato LaTeX.
        Forneça um exemplo de formatação em LaTeX para o estilo {style}.
        Inclua sumários, seções, subseções, listas e ênfases conforme apropriado.
    """
    
    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content(
        contents=prompt,
        )
    
    return response.text


def extract_pdf_text_from_file(file_input) -> Optional[str]:
    """
    Extrai texto de um arquivo PDF (seja um caminho de arquivo ou um 
    objeto de arquivo/stream).
    Retorna None em caso de falha.
    """

    print(type(file_input))
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

def extract_txt_text_from_file(file_input) -> Optional[str]:
    """
    Extrai texto de um arquivo TXT (seja um caminho de arquivo ou um 
    objeto de arquivo/stream).
    Retorna None em caso de falha.
    """
    try:
        if isinstance(file_input, str) or isinstance(file_input, Path):
            with open(file_input, 'r', encoding='utf-8') as f:
                text = f.read()
        else:
            # Assume que file_input é um stream-like object
            text = file_input.read()
            if isinstance(text, bytes):
                text = text.decode('utf-8')
        
        return text.strip() or None # Retorna None se o texto extraído estiver vazio
        
    except Exception as e:
        print(f"Erro ao ler/extrair TXT do arquivo: {e}")
        return None
    
def extract_text_from_file(uploaded_file):
    """
    Extrai texto de um arquivo com base no tipo especificado.
    file_type pode ser 'pdf' ou 'txt'.
    Retorna None em caso de falha ou tipo desconhecido.
    """
    # ---- Lê/extrai o texto do arquivo enviado (correção) ----
    try:
        # garante que o ponteiro do arquivo está no início
        try:
            uploaded_file.seek(0)
        except Exception:
            pass

        filename_lower = uploaded_file.name.lower()
        if filename_lower.endswith('.pdf'):
            extracted_text = extract_pdf_text_from_file(uploaded_file)
            return extracted_text
        elif filename_lower.endswith('.txt'):
            extracted_text = extract_txt_text_from_file(uploaded_file)
            return extracted_text
        else:
            print("error: Formato de arquivo não suportado para extração de texto.")
            return None

    except Exception as e:
        # Mensagem mais informativa para debug em desenvolvimento
        print("Erro ao ler/extrair arquivo na view format_text_view:", repr(e))


def convert_text_to_latex_file(response: str, filename) -> str:
    """
    Salva o texto formatado em LaTeX em um arquivo .tex e retorna o caminho do arquivo.
    """
    folder_path = './arquivos'
    os.makedirs(folder_path, exist_ok=True)
    filename = filename.replace(' ', '_')  # Remove espaços do nome do arquivo
    output_path = os.path.join(folder_path, f'{filename}.tex')
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(response)
        print(f"Arquivo LaTeX salvo em: {output_path}")
        return output_path
    except Exception as e:
        print(f"Erro ao salvar arquivo LaTeX: {e}") 


def convert_tex_file_to_pdf(tex_file_path: str) -> Optional[str]:
    """
    Converte um arquivo .tex em PDF usando PyLaTeX e retorna o caminho do arquivo PDF.
    """
    try:
        doc = Document()
        with open(tex_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            doc.append(NoEscape(content))
        
        pdf_file_path = tex_file_path.replace('.tex', '.pdf')
        doc.generate_pdf(pdf_file_path.replace('.pdf', ''), clean_tex=False, compiler='pdflatex')
        print(f"Arquivo PDF gerado em: {pdf_file_path}")
        return pdf_file_path
    except Exception as e:
        print(f"Erro ao converter .tex para PDF: {e}")
        return None

def format_text_with_gemini(input_text, style, filename) -> bool:
    few_shot = decide_fewshot(style)
    prompt = f"""
        Você é um assistente de formatação de texto para o formato LaTeX, você deve aplicar o estilo solicitado ao texto fornecido.
        Formate o seguinte texto no estilo {style}:
        Siga este few-shot:\n\n{few_shot}
        Texto a ser formatado:
        \n\n{input_text}
        Seja rígoroso quanto à formatação LaTeX e não crie conteúdo novo.
        Retorne apenas o texto formatado em LaTeX. Não outras explicações. Não inclua nada fora do ambiente LaTeX.
    """
    try:
        model = genai.GenerativeModel("gemini-2.5-pro")
        response = model.generate_content(
            contents=prompt,
        )
        print(response.text)
        caminho = convert_text_to_latex_file(response.text, filename)
        convert_tex_file_to_pdf(caminho)
        return True
    except Exception as e:
        print(f"Erro ao formatar texto com Gemini: {e}")
        return False  # Em caso de erro, retorna False