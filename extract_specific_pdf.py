import fitz
import sys

def extract(pdf_path, output_txt):
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        with open(output_txt, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Extraction successful: {output_txt}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python extract_specific_pdf.py <input_pdf> <output_txt>")
    else:
        extract(sys.argv[1], sys.argv[2])
