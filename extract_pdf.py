import fitz
import sys

def extract():
    try:
        doc = fitz.open("Avinash-VCLMS_Report_RevIII-manuscript-draft-pdf-2.pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        with open("manuscript_draft_2.txt", "w", encoding="utf-8") as f:
            f.write(text)
        print("Extraction successful.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract()
