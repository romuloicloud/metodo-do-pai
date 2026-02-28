
import sys
import os

try:
    from pypdf import PdfReader
except ImportError:
    try:
        from PyPDF2 import PdfReader
    except ImportError:
        print("❌ Error: No PDF library found (pypdf or PyPDF2).")
        sys.exit(1)

def extract_text(pdf_filename):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_path = os.path.join(script_dir, pdf_filename)
    output_filename = pdf_filename.replace('.pdf', '_bruto.txt')
    output_path = os.path.join(script_dir, '..', output_filename)

    if not os.path.exists(pdf_path):
        print(f"❌ Error: {pdf_path} not found.")
        return

    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(text)
        
        print(f"✅ Extraction complete. Saved to {output_filename}")
        print(f"📄 Pages: {len(reader.pages)}")
    except Exception as e:
        print(f"❌ Error reading PDF: {e}")

if __name__ == "__main__":
    file_to_process = sys.argv[1] if len(sys.argv) > 1 else 'prova_2025.pdf'
    extract_text(file_to_process)
