from pylatex import Document, Section, Subsection, Command
from pylatex.utils import italic, NoEscape
import os
import requests

folder_path = './arquivos'
os.makedirs(folder_path, exist_ok=True)


# Caminho completo do arquivo sem extensão
output = os.path.join(folder_path, 'arquivo_formatado')

doc = Document()

def fill_content(doc):
    with doc.create(Section('Introdução')):
        doc.append('Este é um texto simples gerado com PyLaTeX.')


fill_content(doc)

doc.generate_pdf(output, clean_tex=False, compiler='pdflatex')
