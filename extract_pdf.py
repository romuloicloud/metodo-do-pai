from pypdf import PdfReader
import sys

pdf_path = r"c:\Users\romul\.gemini\antigravity\brain\1ed9e0ed-d9fb-4cac-9160-14da04fa6ca2\.tempmediaStorage\d570be8c35e8553f.pdf"

try:
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    with open("output.txt", "w", encoding="utf-8") as f:
        f.write(text)
    print("Text extraction complete. Check output.txt")
except Exception as e:
    print(f"Error reading PDF: {e}")
