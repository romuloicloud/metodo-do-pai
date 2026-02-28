"""Analisa quais questoes de cada prova precisam de imagens."""
import json, os, glob

base = os.path.dirname(os.path.abspath(__file__))
parent = os.path.dirname(base)

files = sorted(glob.glob(os.path.join(parent, "extracted_questions*.json")))

for f in files:
    name = os.path.basename(f)
    try:
        data = json.load(open(f, encoding="utf-8"))
        if isinstance(data, dict):
            data = data.get("questoes", data.get("questions", [data]))
        total = len(data)
        with_img = []
        for q in data:
            url = q.get("image_url") or q.get("imageUrl") or ""
            num = q.get("numero_original") or q.get("question_number") or "?"
            if url:
                with_img.append((num, url))
        print(f"\n{name}: {total} questoes, {len(with_img)} com imagem")
        for num, url in with_img:
            print(f"  Q{num}: {url}")
    except Exception as e:
        print(f"\n{name}: ERRO - {e}")
