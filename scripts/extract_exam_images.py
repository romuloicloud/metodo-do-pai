"""
extract_exam_images.py
======================
Pipeline unificado para extrair imagens de provas PDF e associa-las as questoes.

Uso:
  python scripts/extract_exam_images.py YYYY                # Extrai do PDF
  python scripts/extract_exam_images.py YYYY --preview      # Gera preview por pagina
  python scripts/extract_exam_images.py YYYY --from-map     # Usa crop_map manual

Exemplos:
  python scripts/extract_exam_images.py 2017
  python scripts/extract_exam_images.py 2023 --from-map

Requer: pip install pymupdf Pillow numpy
"""

import fitz  # PyMuPDF
import json
import os
import sys
import argparse
import numpy as np
from PIL import Image

# =============================================================================
# CONFIGURACAO
# =============================================================================
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXAMS_DIR = os.path.join(PROJECT_DIR, "public", "assets", "exams")
SCRIPTS_DIR = os.path.join(PROJECT_DIR, "scripts")
DPI = 400
SCALE = DPI / 72
MIN_REGION_AREA = 8000      # area minima em pixels para considerar uma regiao
MIN_DIMENSION = 60          # dimensao minima (largura ou altura) em pixels
SCAN_STEP = 4               # step do scanner (pixels)
MERGE_DISTANCE = 15         # distancia para unir regioes proximas


# =============================================================================
# UTILIDADES
# =============================================================================
def smart_trim(img, margin=10):
    """Remove bordas brancas com margem."""
    arr = np.array(img)
    if len(arr.shape) == 3:
        gray = arr.mean(axis=2)
    else:
        gray = arr.astype(float)

    mask = gray < 245
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)

    if not rows.any() or not cols.any():
        return img

    top = int(np.argmax(rows))
    bottom = int(len(rows) - np.argmax(rows[::-1]))
    left = int(np.argmax(cols))
    right = int(len(cols) - np.argmax(cols[::-1]))

    top = max(0, top - margin)
    bottom = min(img.height, bottom + margin)
    left = max(0, left - margin)
    right = min(img.width, right + margin)

    return img.crop((left, top, right, bottom))


def pdf_page_to_image(doc, page_num):
    """Renderiza pagina do PDF como PIL Image em alta resolucao."""
    page = doc[page_num]
    mat = fitz.Matrix(SCALE, SCALE)
    pix = page.get_pixmap(matrix=mat)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    return img, pix.width, pix.height


def is_image_region(arr):
    """Determina se um bloco de pixels e uma imagem (nao texto puro)."""
    if len(arr.shape) < 3:
        return False

    gray = arr.mean(axis=2)
    variance = float(np.var(gray))
    non_white = float(np.mean(gray < 240))

    # Pixel coloridos (R != G ou G != B)
    r, g, b = arr[:, :, 0].astype(float), arr[:, :, 1].astype(float), arr[:, :, 2].astype(float)
    color_diff = np.abs(r - g) + np.abs(g - b)
    colorful = float(np.mean(color_diff > 15))

    # Linhas/bordas (cinza medio - tabelas, grades)
    gray_ratio = float(np.mean((gray > 80) & (gray < 200)))

    return (
        variance > 2500 or
        colorful > 0.08 or
        (non_white > 0.35 and variance > 800) or
        (gray_ratio > 0.12 and non_white > 0.18)
    )


def detect_image_regions(img):
    """Detecta regioes de imagem na pagina usando scanner por blocos."""
    arr = np.array(img)
    h, w = arr.shape[:2]
    block_size = 80
    image_mask = np.zeros((h, w), dtype=bool)

    for y in range(0, h - block_size, SCAN_STEP):
        for x in range(0, w - block_size, SCAN_STEP):
            block = arr[y:y + block_size, x:x + block_size]
            if is_image_region(block):
                image_mask[y:y + block_size, x:x + block_size] = True

    # Encontra bounding boxes das regioes conectadas
    from scipy import ndimage
    labeled, num_features = ndimage.label(image_mask)

    regions = []
    for i in range(1, num_features + 1):
        ys, xs = np.where(labeled == i)
        top, bottom = int(ys.min()), int(ys.max())
        left, right = int(xs.min()), int(xs.max())
        rw, rh = right - left, bottom - top
        area = rw * rh

        if area >= MIN_REGION_AREA and rw >= MIN_DIMENSION and rh >= MIN_DIMENSION:
            # Ignora cabecalhos (regioes no topo, muito largas e pouco altas)
            if top < h * 0.08 and rw > w * 0.7 and rh < h * 0.06:
                continue
            regions.append({
                "top": top, "bottom": bottom,
                "left": left, "right": right,
                "width": rw, "height": rh,
                "area": area
            })

    return regions


def detect_image_regions_simple(img):
    """Deteccao simplificada sem scipy - usa varredura por faixas."""
    arr = np.array(img)
    h, w = arr.shape[:2]
    block_h = 100
    regions = []

    y = 0
    in_region = False
    region_start = 0

    while y < h - block_h:
        strip = arr[y:y + block_h, :, :]
        gray = strip.mean(axis=2)
        non_white = float(np.mean(gray < 240))
        variance = float(np.var(gray))

        is_content = non_white > 0.05 and variance > 500

        if is_content and not in_region:
            region_start = y
            in_region = True
        elif not is_content and in_region:
            rh = y - region_start
            if rh > MIN_DIMENSION:
                # Analisa se e imagem ou texto
                region_arr = arr[region_start:y, :, :]
                if is_image_region(region_arr):
                    regions.append({
                        "top": region_start, "bottom": y,
                        "left": 0, "right": w,
                        "width": w, "height": rh,
                        "area": w * rh
                    })
            in_region = False

        y += SCAN_STEP * 4

    return regions


# =============================================================================
# MODO 1: EXTRACAO AUTOMATICA
# =============================================================================
def extract_auto(year, pdf_path):
    """Extrai imagens automaticamente usando deteccao de regioes."""
    print(f"[AUTO] Extraindo imagens de {os.path.basename(pdf_path)}...")

    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    print(f"  PDF: {total_pages} paginas, DPI: {DPI}\n")

    all_regions = []
    for page_num in range(total_pages):
        img, w, h = pdf_page_to_image(doc, page_num)

        try:
            regions = detect_image_regions(img)
        except ImportError:
            # scipy nao disponivel, usar metodo simplificado
            regions = detect_image_regions_simple(img)

        for idx, region in enumerate(regions):
            cropped = img.crop((region["left"], region["top"],
                                region["right"], region["bottom"]))
            cropped = smart_trim(cropped)

            if cropped.width < MIN_DIMENSION or cropped.height < MIN_DIMENSION:
                continue

            # Salva com nome temporario para curadoria
            temp_name = f"{year}_p{page_num + 1:02d}_r{idx + 1:02d}.png"
            temp_path = os.path.join(EXAMS_DIR, temp_name)
            cropped.save(temp_path, "PNG", optimize=True)
            size_kb = os.path.getsize(temp_path) / 1024

            print(f"  Pag {page_num + 1:2d} | Regiao {idx + 1} | "
                  f"{cropped.width}x{cropped.height} | "
                  f"{size_kb:.0f}KB | {temp_name}")
            all_regions.append({
                "file": temp_name,
                "page": page_num + 1,
                "region": idx + 1,
                "width": cropped.width,
                "height": cropped.height,
                "size_kb": round(size_kb, 1)
            })

    doc.close()

    # Salva manifest temporario
    manifest_path = os.path.join(EXAMS_DIR, f"{year}_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump({"year": year, "dpi": DPI, "regions": all_regions}, f, indent=2)

    print(f"\n  Total: {len(all_regions)} regioes detectadas")
    print(f"  Manifest: {manifest_path}")
    print(f"\n  PROXIMO PASSO:")
    print(f"  1. Revise as imagens em public/assets/exams/")
    print(f"  2. Crie o arquivo scripts/{year}_crop_map.json com o mapeamento")
    print(f"  3. Execute: python scripts/extract_exam_images.py {year} --from-map")

    return all_regions


# =============================================================================
# MODO 2: PREVIEW POR PAGINA
# =============================================================================
def extract_preview(year, pdf_path):
    """Gera uma imagem por pagina para inspecao visual."""
    print(f"[PREVIEW] Gerando previews de {os.path.basename(pdf_path)}...")

    doc = fitz.open(pdf_path)
    total_pages = len(doc)

    preview_dir = os.path.join(EXAMS_DIR, f"{year}_preview")
    os.makedirs(preview_dir, exist_ok=True)

    for page_num in range(total_pages):
        img, w, h = pdf_page_to_image(doc, page_num)
        path = os.path.join(preview_dir, f"page_{page_num + 1:02d}.png")
        img.save(path, "PNG", optimize=True)
        size_kb = os.path.getsize(path) / 1024
        print(f"  Pag {page_num + 1:2d} | {w}x{h} | {size_kb:.0f}KB")

    doc.close()
    print(f"\n  {total_pages} previews em: {preview_dir}/")
    print(f"  Use estas imagens para criar o crop_map manualmente.")


# =============================================================================
# MODO 3: CROP A PARTIR DE MAPA MANUAL
# =============================================================================
def extract_from_map(year, pdf_path):
    """Extrai imagens usando coordenadas definidas no crop_map JSON."""
    map_path = os.path.join(SCRIPTS_DIR, f"{year}_crop_map.json")

    if not os.path.exists(map_path):
        print(f"ERRO: Arquivo de mapeamento nao encontrado: {map_path}")
        print(f"\nCrie o arquivo com o formato:")
        print(json.dumps({
            "year": year,
            "dpi": DPI,
            "crops": {
                "10": {
                    "page": 4,
                    "top": 0.30,
                    "bottom": 0.70,
                    "left": 0.05,
                    "right": 0.95,
                    "description": "Descricao da figura"
                }
            }
        }, indent=2))
        return

    with open(map_path, "r", encoding="utf-8") as f:
        crop_map = json.load(f)

    crops = crop_map.get("crops", {})
    print(f"[CROP MAP] {len(crops)} questoes mapeadas para {year}")

    doc = fitz.open(pdf_path)
    results = []

    for q_key, info in crops.items():
        page = info["page"]
        desc = info.get("description", "")

        print(f"\n  Q{q_key}: {desc}")

        img, w, h = pdf_page_to_image(doc, page - 1)  # 0-indexed

        left = int(w * info["left"])
        top_px = int(h * info["top"])
        right = int(w * info["right"])
        bottom_px = int(h * info["bottom"])

        cropped = img.crop((left, top_px, right, bottom_px))
        cropped = smart_trim(cropped)

        output_name = f"{year}_q{q_key}.png"
        output_path = os.path.join(EXAMS_DIR, output_name)
        cropped.save(output_path, "PNG", optimize=True)

        size_kb = os.path.getsize(output_path) / 1024
        print(f"    -> {output_name} ({cropped.width}x{cropped.height}, {size_kb:.0f}KB)")
        results.append((q_key, output_name, size_kb))

    doc.close()

    # Limpa temp files da extracao automatica
    cleanup_temp_files(year)

    # Relatorio final
    print(f"\n{'=' * 50}")
    print(f"  {len(results)} imagens extraidas para {year}")
    print(f"{'=' * 50}")
    for q, name, size in sorted(results):
        print(f"  Q{q} -> {name} ({size:.0f}KB)")

    print(f"\n  image_url para o Supabase:")
    for q, name, _ in sorted(results):
        print(f'    Q{q}: "/assets/exams/{name}"')


def cleanup_temp_files(year):
    """Remove arquivos temporarios de extracao."""
    import glob
    patterns = [
        os.path.join(EXAMS_DIR, f"{year}_p*_r*.png"),
        os.path.join(EXAMS_DIR, f"{year}_manifest.json"),
    ]
    count = 0
    for pattern in patterns:
        for f in glob.glob(pattern):
            os.remove(f)
            count += 1

    preview_dir = os.path.join(EXAMS_DIR, f"{year}_preview")
    if os.path.isdir(preview_dir):
        import shutil
        shutil.rmtree(preview_dir)
        count += 1

    if count > 0:
        print(f"\n  Limpeza: {count} arquivos temporarios removidos")


# =============================================================================
# CLI
# =============================================================================
def find_pdf(year):
    """Procura o PDF da prova no diretorio scripts."""
    candidates = [
        os.path.join(SCRIPTS_DIR, f"prova_{year}.pdf"),
        os.path.join(SCRIPTS_DIR, f"prova_{year}_full.pdf"),
        os.path.join(PROJECT_DIR, f"prova_{year}.pdf"),
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return None


def main():
    parser = argparse.ArgumentParser(
        description="Pipeline de extracao de imagens de provas PDF"
    )
    parser.add_argument("year", type=str, help="Ano da prova (ex: 2023)")
    parser.add_argument("--preview", action="store_true",
                        help="Gera preview de cada pagina")
    parser.add_argument("--from-map", action="store_true",
                        help="Extrai usando crop_map JSON")
    parser.add_argument("--pdf", type=str, default=None,
                        help="Caminho do PDF (auto-detectado se omitido)")
    parser.add_argument("--cleanup", action="store_true",
                        help="Remove apenas arquivos temporarios")

    args = parser.parse_args()
    year = args.year

    # Cleanup only
    if args.cleanup:
        cleanup_temp_files(year)
        return

    # Encontra PDF
    pdf_path = args.pdf or find_pdf(year)
    if not pdf_path:
        print(f"ERRO: PDF nao encontrado para {year}")
        print(f"Coloque o PDF em scripts/prova_{year}.pdf")
        sys.exit(1)

    print(f"PDF: {pdf_path}")
    os.makedirs(EXAMS_DIR, exist_ok=True)

    if args.preview:
        extract_preview(year, pdf_path)
    elif args.from_map:
        extract_from_map(year, pdf_path)
    else:
        extract_auto(year, pdf_path)


if __name__ == "__main__":
    main()
