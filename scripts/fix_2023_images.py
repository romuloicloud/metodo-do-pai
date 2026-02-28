"""
fix_2023_images.py
==================
Script para:
1. Re-extrair imagens fragmentadas/faltantes do PDF 2023 (malha Q11, castelo Q12, retângulo Q19)
2. Renomear imagens confirmadas para o padrão 2023_qNN.png
3. Gerar um relatório de mapeamento

Requer: pip install pymupdf Pillow
Uso: python scripts/fix_2023_images.py
"""

import fitz  # PyMuPDF
import os
import shutil
from PIL import Image

# Diretórios
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXAMS_DIR = os.path.join(PROJECT_DIR, "public", "assets", "exams")
PDF_PATH = os.path.join(PROJECT_DIR, "scripts", "prova_2023.pdf")

# Mapeamento confirmado: questão → arquivo temporário existente
CONFIRMED_MAPPINGS = {
    10: "2023_page04_img06.png",  # Tirinha Armandinho
    14: "2023_page08_img04.png",  # Prismas
    15: "2023_page08_img07.png",  # Gráfico pizza (rádio)
    17: "2023_page09_img05.png",  # Livros e cadernos (Thiago)
    18: "2023_page09_img07.png",  # Potes/jarras
}

# Páginas e regiões para re-extração (figuras fragmentadas ou não capturadas)
# Q11 = malha com Casa Ana, Escola, Padaria, Mercado (página 6, região grande com grade)
# Q12 = castelo em malha quadriculada (página 7)
# Q19 = retângulo dividido em regiões (página 10)
REEXTRACT_PAGES = {
    11: {"page": 6, "description": "Malha quadriculada - rota da Ana"},
    12: {"page": 7, "description": "Castelo em malha quadriculada"},
    19: {"page": 10, "description": "Retângulo dividido em regiões"},
}

DPI = 300  # Alta resolução para re-extração


def extract_full_page_image(pdf_path, page_num, output_path):
    """Extrai a página inteira como imagem e permite crop manual das regiões."""
    doc = fitz.open(pdf_path)
    page = doc[page_num - 1]  # 0-indexed
    
    # Renderiza a página em alta resolução
    mat = fitz.Matrix(DPI / 72, DPI / 72)
    pix = page.get_pixmap(matrix=mat)
    
    # Salva a página inteira
    full_page_path = output_path.replace(".png", "_fullpage.png")
    pix.save(full_page_path)
    print(f"  Página {page_num} salva como: {full_page_path}")
    print(f"  Dimensões: {pix.width}x{pix.height}")
    
    doc.close()
    return full_page_path, pix.width, pix.height


def auto_crop_image_region(full_page_path, question_num, page_num, width, height):
    """
    Corta automaticamente a região da figura baseado nas coordenadas conhecidas
    do layout da prova CPII 2023.
    """
    img = Image.open(full_page_path)
    
    # Coordenadas aproximadas das figuras (em proporção da página)
    # Essas coordenadas são baseadas na análise visual do PDF
    crop_regions = {
        11: {
            # Malha Q11: está na metade inferior da página 6
            # A malha com rosa dos ventos, Casa Ana, Escola, Padaria, Mercado
            "top": 0.42,     # ~42% do topo da página
            "bottom": 0.82,  # ~82% do topo
            "left": 0.05,    # margem esquerda
            "right": 0.95,   # margem direita
        },
        12: {
            # Castelo Q12: parte superior da página 7
            # Desenho do castelo em malha quadriculada
            "top": 0.08,
            "bottom": 0.45,
            "left": 0.10,
            "right": 0.90,
        },
        19: {
            # Retângulo Q19: metade da página 10
            # Retângulo dividido em regiões menores
            "top": 0.28,
            "bottom": 0.55,
            "left": 0.15,
            "right": 0.85,
        },
    }
    
    region = crop_regions.get(question_num)
    if not region:
        print(f"  ⚠ Sem coordenadas de crop para Q{question_num}")
        return None
    
    left = int(width * region["left"])
    top = int(height * region["top"])
    right = int(width * region["right"])
    bottom = int(height * region["bottom"])
    
    cropped = img.crop((left, top, right, bottom))
    
    # Auto-trim: remove bordas brancas excessivas
    cropped = auto_trim(cropped)
    
    output_path = os.path.join(EXAMS_DIR, f"2023_q{question_num:02d}.png")
    cropped.save(output_path, "PNG", optimize=True)
    
    size_kb = os.path.getsize(output_path) / 1024
    print(f"  ✅ Q{question_num} → 2023_q{question_num:02d}.png ({size_kb:.1f} KB)")
    
    return output_path


def auto_trim(img):
    """Remove bordas brancas excessivas."""
    import numpy as np
    arr = np.array(img)
    
    # Detecta linhas/colunas não-brancas
    if len(arr.shape) == 3:
        gray = arr.mean(axis=2)
    else:
        gray = arr
    
    rows = gray.min(axis=1) < 240
    cols = gray.min(axis=0) < 240
    
    if not rows.any() or not cols.any():
        return img
    
    top = rows.argmax()
    bottom = len(rows) - rows[::-1].argmax()
    left = cols.argmax()
    right = len(cols) - cols[::-1].argmax()
    
    # Adiciona margem
    margin = 10
    top = max(0, top - margin)
    bottom = min(img.height, bottom + margin)
    left = max(0, left - margin)
    right = min(img.width, right + margin)
    
    return img.crop((left, top, right, bottom))


def rename_confirmed_images():
    """Renomeia imagens confirmadas para o padrão 2023_qNN.png."""
    print("\n📋 Renomeando imagens confirmadas...")
    
    for q_num, source_file in CONFIRMED_MAPPINGS.items():
        source_path = os.path.join(EXAMS_DIR, source_file)
        dest_path = os.path.join(EXAMS_DIR, f"2023_q{q_num:02d}.png")
        
        if os.path.exists(source_path):
            shutil.copy2(source_path, dest_path)  # copy, não move (para segurança)
            size_kb = os.path.getsize(dest_path) / 1024
            print(f"  ✅ Q{q_num}: {source_file} → 2023_q{q_num:02d}.png ({size_kb:.1f} KB)")
        else:
            print(f"  ❌ Q{q_num}: Arquivo não encontrado: {source_file}")


def reextract_missing_images():
    """Re-extrai imagens fragmentadas/faltantes do PDF."""
    print("\n🔍 Re-extraindo imagens faltantes do PDF...")
    
    if not os.path.exists(PDF_PATH):
        print(f"  ❌ PDF não encontrado: {PDF_PATH}")
        print("  Pulando re-extração. As imagens Q11, Q12 e Q19 precisam ser extraídas manualmente.")
        return
    
    for q_num, info in REEXTRACT_PAGES.items():
        page_num = info["page"]
        desc = info["description"]
        print(f"\n  📄 Q{q_num} ({desc}) - Página {page_num}")
        
        full_path, w, h = extract_full_page_image(PDF_PATH, page_num, 
                                                     os.path.join(EXAMS_DIR, f"2023_q{q_num:02d}.png"))
        auto_crop_image_region(full_path, q_num, page_num, w, h)
        
        # Remove arquivo temporário da página inteira
        if os.path.exists(full_path):
            os.remove(full_path)


def generate_report():
    """Gera relatório final do mapeamento."""
    print("\n" + "=" * 60)
    print("📊 RELATÓRIO FINAL - Imagens 2023")
    print("=" * 60)
    
    all_questions = [10, 11, 12, 14, 15, 17, 18, 19]
    ready = []
    missing = []
    
    for q_num in all_questions:
        target_file = f"2023_q{q_num:02d}.png"
        target_path = os.path.join(EXAMS_DIR, target_file)
        
        if os.path.exists(target_path):
            size_kb = os.path.getsize(target_path) / 1024
            ready.append((q_num, target_file, size_kb))
        else:
            missing.append(q_num)
    
    print(f"\n✅ Prontas ({len(ready)}/{len(all_questions)}):")
    for q_num, fname, size in ready:
        print(f"   Q{q_num:02d} → {fname} ({size:.1f} KB)")
    
    if missing:
        print(f"\n❌ Faltantes ({len(missing)}):")
        for q_num in missing:
            print(f"   Q{q_num:02d}")
    
    # Gera JSON de mapeamento para atualização do Supabase
    print("\n📝 URLs para atualizar no Supabase:")
    for q_num, fname, _ in ready:
        url = f"/assets/exams/{fname}"
        print(f'   Q{q_num}: image_url = "{url}"')
    
    print("\n" + "=" * 60)


def main():
    print("🔧 Fix de Imagens - Prova CPII 2023")
    print("=" * 60)
    
    # Passo 1: Renomear imagens confirmadas
    rename_confirmed_images()
    
    # Passo 2: Re-extrair imagens faltantes
    reextract_missing_images()
    
    # Passo 3: Relatório
    generate_report()


if __name__ == "__main__":
    main()
