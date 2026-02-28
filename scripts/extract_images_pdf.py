"""
extract_images_pdf.py

Scanner de Imagens + Auto-Crop para provas PDF.
Renderiza cada página em alta resolução usando PyMuPDF,
detecta regiões de imagem e faz recorte automático.

Uso: python scripts/extract_images_pdf.py scripts/prova_2023.pdf

Dependências: pymupdf, Pillow
"""

import sys
import os
import json
import fitz  # PyMuPDF
from PIL import Image
import io

# === CONFIGURAÇÃO ===
DPI = 300
SCALE = DPI / 72  # fitz usa 72 DPI por padrão
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'exams')

# Limiares para detecção
MIN_IMAGE_HEIGHT = 60  # pixels mínimos
STRIP_HEIGHT = 20      # altura de cada faixa de análise
SAMPLE_STEP = 3        # amostragem horizontal a cada N pixels


def ensure_dir(d):
    os.makedirs(d, exist_ok=True)


def extract_year(filename):
    """Extrai o ano do nome do arquivo."""
    import re
    match = re.search(r'(\d{4})', filename)
    return match.group(1) if match else 'unknown'


def render_page(page, scale):
    """Renderiza uma página do PDF como imagem PIL."""
    mat = fitz.Matrix(scale, scale)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    img_data = pix.tobytes("png")
    return Image.open(io.BytesIO(img_data)), pix.width, pix.height


def detect_image_regions(img, page_num):
    """
    Detecta regiões de imagem em uma página renderizada.
    Analisa faixas horizontais e usa heurísticas de cor para distinguir
    imagens/gráficos de texto puro.
    """
    width, height = img.size
    pixels = img.load()
    regions = []
    total_strips = height // STRIP_HEIGHT

    in_image = False
    region_start = 0
    consecutive_text = 0

    for strip in range(total_strips):
        y = strip * STRIP_HEIGHT
        strip_pixels = []

        # Amostrar pixels da faixa
        for x in range(0, width, SAMPLE_STEP):
            if y < height:
                r, g, b = pixels[x, y][:3] if isinstance(pixels[x, y], tuple) else (pixels[x, y], pixels[x, y], pixels[x, y])
                strip_pixels.append((r, g, b))

        if not strip_pixels:
            continue

        n = len(strip_pixels)

        # Médias
        avg_r = sum(p[0] for p in strip_pixels) / n
        avg_g = sum(p[1] for p in strip_pixels) / n
        avg_b = sum(p[2] for p in strip_pixels) / n

        # Variância de cor
        variance = sum(
            (p[0] - avg_r) ** 2 + (p[1] - avg_g) ** 2 + (p[2] - avg_b) ** 2
            for p in strip_pixels
        ) / n

        # Proporção de pixels não-brancos
        non_white = sum(1 for p in strip_pixels if p[0] < 230 or p[1] < 230 or p[2] < 230)
        non_white_ratio = non_white / n

        # Proporção de pixels coloridos (não cinza)
        colorful = sum(1 for p in strip_pixels if max(p) - min(p) > 25)
        colorful_ratio = colorful / n

        # Proporção de pixels com cinza médio (linhas de gráfico/tabela/bordas)
        gray_medium = sum(1 for p in strip_pixels if 50 < p[0] < 200 and abs(p[0] - p[1]) < 15 and abs(p[1] - p[2]) < 15)
        gray_ratio = gray_medium / n

        # Heurística: é região de imagem?
        is_image = (
            variance > 2500 or
            colorful_ratio > 0.10 or
            (non_white_ratio > 0.40 and variance > 800) or
            (gray_ratio > 0.15 and non_white_ratio > 0.20)  # tabelas, bordas, malhas
        )

        if is_image:
            consecutive_text = 0
            if not in_image:
                in_image = True
                region_start = y
        else:
            if in_image:
                consecutive_text += 1
                # Permitir 2 faixas de "texto" dentro de uma região (gaps pequenos)
                if consecutive_text >= 3:
                    in_image = False
                    consecutive_text = 0
                    region_height = y - region_start - (2 * STRIP_HEIGHT)
                    if region_height >= MIN_IMAGE_HEIGHT:
                        margin = 40
                        reg_y = max(0, region_start - margin)
                        reg_h = min(region_height + margin * 2, height - reg_y)
                        regions.append({
                            'x': 0,
                            'y': reg_y,
                            'width': width,
                            'height': reg_h,
                            'page': page_num
                        })

    # Fechar região aberta
    if in_image:
        region_height = height - region_start
        if region_height >= MIN_IMAGE_HEIGHT:
            margin = 40
            reg_y = max(0, region_start - margin)
            reg_h = min(region_height + margin * 2, height - reg_y)
            regions.append({
                'x': 0,
                'y': reg_y,
                'width': width,
                'height': reg_h,
                'page': page_num
            })

    return regions


def crop_and_save(img, region, output_path):
    """Recorta a região e aplica auto-trim (remove bordas brancas)."""
    cropped = img.crop((
        region['x'],
        region['y'],
        region['x'] + region['width'],
        region['y'] + region['height']
    ))

    # Auto-trim: remover bordas brancas
    bg = Image.new(cropped.mode, cropped.size, (255, 255, 255))
    diff = Image.new('L', cropped.size)
    
    for x in range(cropped.width):
        for y in range(cropped.height):
            cr, cg, cb = cropped.getpixel((x, y))[:3]
            if cr < 245 or cg < 245 or cb < 245:
                diff.putpixel((x, y), 255)
            else:
                diff.putpixel((x, y), 0)
    
    bbox = diff.getbbox()
    if bbox:
        # Adicionar pequena margem ao trim
        margin = 10
        bbox = (
            max(0, bbox[0] - margin),
            max(0, bbox[1] - margin),
            min(cropped.width, bbox[2] + margin),
            min(cropped.height, bbox[3] + margin)
        )
        cropped = cropped.crop(bbox)

    cropped.save(output_path, 'PNG', optimize=True)
    return os.path.getsize(output_path)


def main():
    if len(sys.argv) < 2:
        print("❌ Uso: python scripts/extract_images_pdf.py <arquivo.pdf>")
        print("   Exemplo: python scripts/extract_images_pdf.py scripts/prova_2023.pdf")
        sys.exit(1)

    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        # Tentar em scripts/
        alt_path = os.path.join('scripts', pdf_path)
        if os.path.exists(alt_path):
            pdf_path = alt_path
        else:
            print(f"❌ Arquivo não encontrado: {pdf_path}")
            sys.exit(1)

    year = extract_year(os.path.basename(pdf_path))
    print(f"\n🔍 Extração Visual — Prova {year}")
    print("━" * 50)

    ensure_dir(OUTPUT_DIR)

    doc = fitz.open(pdf_path)
    num_pages = len(doc)
    print(f"📄 {num_pages} páginas encontradas.")

    total_images = 0
    extracted = []

    for page_num in range(num_pages):
        page = doc[page_num]
        print(f"\n📃 Página {page_num + 1}/{num_pages}...")

        # Renderizar página
        img, w, h = render_page(page, SCALE)
        print(f"   📐 {w}x{h} px")

        # Detectar regiões
        regions = detect_image_regions(img, page_num + 1)

        if not regions:
            print("   ⏭️  Sem imagens detectadas.")
            continue

        print(f"   🖼️  {len(regions)} região(ões) encontrada(s).")

        for r_idx, region in enumerate(regions):
            total_images += 1
            temp_name = f"{year}_page{str(page_num + 1).zfill(2)}_img{str(r_idx + 1).zfill(2)}.png"
            output_path = os.path.join(OUTPUT_DIR, temp_name)

            try:
                file_size = crop_and_save(img, region, output_path)
                size_kb = f"{file_size / 1024:.1f}"
                print(f"   ✅ {temp_name} ({size_kb} KB)")
                extracted.append({
                    'fileName': temp_name,
                    'page': page_num + 1,
                    'regionIndex': r_idx,
                    'sizeKB': size_kb
                })
            except Exception as e:
                print(f"   ⚠️  Erro ao recortar: {e}")
                total_images -= 1

    doc.close()

    # Relatório final
    print(f"\n{'━' * 50}")
    print(f"📊 Extração concluída!")
    print(f"   📄 Páginas: {num_pages}")
    print(f"   🖼️  Imagens extraídas: {total_images}")
    print(f"   📁 Salvas em: public/assets/exams/")

    if total_images > 0:
        print(f"\n⚠️  PRÓXIMO PASSO:")
        print(f"   Renomeie os arquivos para: {{ano}}_{{materia}}_q{{num}}.png")
        print(f"   Ex: {year}_mat_q11.png, {year}_port_q10.png")

    # Salvar manifesto
    manifest_path = os.path.join(OUTPUT_DIR, f"{year}_extraction_manifest.json")
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(extracted, f, indent=2, ensure_ascii=False)
    print(f"\n📋 Manifesto: {os.path.basename(manifest_path)}")


if __name__ == '__main__':
    main()
