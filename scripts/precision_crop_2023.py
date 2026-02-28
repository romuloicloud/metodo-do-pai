"""
precision_crop_2023.py
======================
Re-extrai imagens do PDF 2023 com recorte PRECISO:
- Apenas a FIGURA visual (sem enunciado, sem alternativas, sem cabeçalho)
- Usa coordenadas calibradas manualmente para cada questão

Requer: pip install pymupdf Pillow numpy
Uso: python scripts/precision_crop_2023.py
"""

import fitz  # PyMuPDF
import os
import numpy as np
from PIL import Image
from io import BytesIO

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXAMS_DIR = os.path.join(PROJECT_DIR, "public", "assets", "exams")
PDF_PATH = os.path.join(PROJECT_DIR, "scripts", "prova_2023.pdf")

DPI = 400  # Alta resolucao para qualidade premium
SCALE = DPI / 72  # fator de escala do PDF para pixels


def pdf_page_to_image(doc, page_num):
    """Renderiza uma pagina do PDF como PIL Image."""
    page = doc[page_num - 1]
    mat = fitz.Matrix(SCALE, SCALE)
    pix = page.get_pixmap(matrix=mat)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    return img, pix.width, pix.height


def smart_trim(img, margin=8):
    """Remove bordas brancas com margem minima."""
    arr = np.array(img)
    if len(arr.shape) == 3:
        gray = arr.mean(axis=2)
    else:
        gray = arr.astype(float)

    # Limiar para conteudo (pixels nao-brancos)
    mask = gray < 245

    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)

    if not rows.any() or not cols.any():
        return img

    top = np.argmax(rows)
    bottom = len(rows) - np.argmax(rows[::-1])
    left = np.argmax(cols)
    right = len(cols) - np.argmax(cols[::-1])

    # Margem
    top = max(0, top - margin)
    bottom = min(img.height, bottom + margin)
    left = max(0, left - margin)
    right = min(img.width, right + margin)

    return img.crop((left, top, right, bottom))


def crop_figure(img, w, h, top_pct, bottom_pct, left_pct, right_pct):
    """Recorta regiao da imagem usando porcentagem."""
    left = int(w * left_pct)
    top = int(h * top_pct)
    right = int(w * right_pct)
    bottom = int(h * bottom_pct)
    cropped = img.crop((left, top, right, bottom))
    return smart_trim(cropped)


def save_image(img, question_num):
    """Salva imagem final."""
    path = os.path.join(EXAMS_DIR, f"2023_q{question_num:02d}.png")
    img.save(path, "PNG", optimize=True)
    size_kb = os.path.getsize(path) / 1024
    print(f"  OK Q{question_num:02d} -> 2023_q{question_num:02d}.png ({img.width}x{img.height}, {size_kb:.1f}KB)")
    return path


def main():
    print("== Recorte Preciso - Prova CPII 2023 ==\n")

    if not os.path.exists(PDF_PATH):
        print(f"ERRO: PDF nao encontrado: {PDF_PATH}")
        return

    doc = fitz.open(PDF_PATH)
    total_pages = len(doc)
    print(f"PDF: {total_pages} paginas, DPI: {DPI}\n")

    # ================================================================
    # COORDENADAS PRECISAS (% da pagina)
    # Calibradas para pegar APENAS a figura, sem texto
    # ================================================================
    # Formato: (page, top%, bottom%, left%, right%, descricao)

    crops = {
        # Q11: Malha (grade) - pagina 6
        # Grade quadriculada com rosa dos ventos + pontos Casa, Padaria, Mercado, Escola
        11: (6, 0.30, 0.72, 0.08, 0.92,
             "Malha quadriculada - Casa, Padaria, Mercado, Escola"),

        # Q12: Castelo - pagina 7
        # APENAS o desenho do castelo na malha, sem enunciado nem texto embaixo
        12: (7, 0.20, 0.54, 0.18, 0.82,
             "Castelo em malha quadriculada"),

        # Q18: Potes/jarras - pagina 9
        # APENAS os 5 potes de tinta, sem nenhum texto
        18: (9, 0.69, 0.755, 0.12, 0.88,
             "5 potes de tinta"),

        # Q19: Retangulo dividido - pagina 10
        # APENAS o retangulo geometrico com divisoes internas
        19: (10, 0.17, 0.35, 0.28, 0.68,
             "Retangulo dividido em regioes"),
    }

    results = []

    for q_num, (page, top, bottom, left, right, desc) in crops.items():
        print(f"Q{q_num:02d}: {desc}")
        img, w, h = pdf_page_to_image(doc, page)
        cropped = crop_figure(img, w, h, top, bottom, left, right)
        path = save_image(cropped, q_num)
        results.append((q_num, path))

    doc.close()

    # Resumo
    print(f"\n== {len(results)} imagens recortadas ==")
    print("\nImagens que ja estavam OK (nao alteradas):")
    print("  Q10 - Tirinha Armandinho")
    print("  Q14 - Prismas")
    print("  Q15 - Grafico pizza (radio)")
    print("  Q17 - Livros e cadernos")


if __name__ == "__main__":
    main()
