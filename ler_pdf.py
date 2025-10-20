from PyPDF2 import PdfReader

def extrair_texto_pdf(caminho_pdf: str) -> str:
    """
    Lê um arquivo PDF e retorna todo o texto concatenado.
    """
    texto_total = ""
    with open(caminho_pdf, "rb") as arquivo:
        leitor = PdfReader(arquivo)
        for pagina in leitor.pages:
            texto_total += pagina.extract_text() or ""
    return texto_total

# Exemplo de uso
texto = extrair_texto_pdf("attention.pdf")
print(texto[:50000])  # Mostra os primeiros 500 caracteres
