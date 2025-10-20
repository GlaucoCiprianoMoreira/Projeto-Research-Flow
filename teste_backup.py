#!/usr/bin/env python3
"""
teste.py

Script simples para testar a função de resumo enviando um link de artigo (PDF).

Uso:
  python teste.py --url "https://example.org/paper.pdf"

Observações:
- Certifique-se de ativar o virtualenv e instalar as dependências:
    python -m venv .venv; .venv\Scripts\Activate.ps1
    pip install -r requirements.txt
- Coloque sua chave `GOOGLE_API_KEY` em um arquivo `.env` na raiz ou exporte como variável de ambiente.
"""
import os
import sys
import json
import argparse
from dotenv import load_dotenv

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import cm


ROOT = os.path.dirname(__file__)
BACKEND = os.path.join(ROOT, 'backend')

# Garante que possamos importar pacotes dentro de backend/ (incluindo analyzer.services)
if BACKEND not in sys.path:
    sys.path.insert(0, BACKEND)
if os.path.join(BACKEND, 'analyzer') not in sys.path:
    sys.path.insert(0, os.path.join(BACKEND, 'analyzer'))

# Carrega .env (se existir)
load_dotenv(os.path.join(ROOT, '.env'))


def main():
    parser = argparse.ArgumentParser(description='Teste summarize_article com URL de PDF')
    parser.add_argument('--url', '-u', required=True, help='URL pública para um PDF do artigo')
    args = parser.parse_args()

    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        print('Aviso: GOOGLE_API_KEY não encontrado nas variáveis de ambiente. Você precisa configurá-lo para que o Gemini funcione.')

    # Importa diretamente as funções de analyzer.services para um teste direto
    try:
        from analyzer.services import fetch_pdf_text_from_url, summarize_article_with_gemini
    except Exception as e:
        print('Erro ao importar analyzer.services:', e)
        sys.exit(1)

    print('Baixando e extraindo texto do PDF:', args.url)
    article_text = fetch_pdf_text_from_url(args.url)
    if not article_text:
        print('Falha ao obter texto do PDF.')
        sys.exit(1)

    print('Chamando summarize_article_with_gemini...')
    # Passa também uma consulta em linguagem natural que descreve o que o usuário quer
    natural_query = 'Resuma o artigo com destaque e com clareza.'
    result = summarize_article_with_gemini(article_text, natural_query)

    print('\nResultado:')
    print(json.dumps(result, ensure_ascii=False, indent=2))
    salvar_resultado_pdf(result)

def salvar_resultado_pdf(result, output_path="resultado.pdf"):
    """
    Gera um PDF com o conteúdo do dicionário 'result' formatado.
    """
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    # Adiciona título
    story.append(Paragraph("Resumo do Artigo", styles["Title"]))
    story.append(Spacer(1, 0.5 * cm))

    # Adiciona cada chave-valor formatado
    if isinstance(result, dict):
        for chave, valor in result.items():
            story.append(Paragraph(f"<b>{chave.capitalize()}:</b>", styles["Heading3"]))
            story.append(Paragraph(str(valor), styles["BodyText"]))
            story.append(Spacer(1, 0.4 * cm))
    else:
        # Caso o resultado seja texto simples
        story.append(Paragraph(str(result), styles["BodyText"]))

    doc.build(story)
    print(f"\nPDF salvo com sucesso em: {os.path.abspath(output_path)}")


if __name__ == '__main__':
    main()
