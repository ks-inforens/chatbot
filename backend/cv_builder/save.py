from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
from fpdf import FPDF  

def save_as_docx(text, filename="generated_cv.docx"):
    doc = Document()

    # Set base style
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Arial'
    font.size = Pt(11)

    lines = text.split('\n')
    first_line = True

    for line in lines:
        line = line.strip()
        if not line:
            doc.add_paragraph()
            continue

        # Center-align first line as name
        if first_line:
            para = doc.add_paragraph()
            para.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
            run = para.add_run(line)
            run.bold = True
            run.font.size = Pt(16)
            first_line = False
            continue

        # Section Headings (lines starting with ##)
        if line.startswith("## "):
            section_title = line.replace("##", "").strip()
            para = doc.add_paragraph()
            run = para.add_run(section_title)
            run.bold = True
            run.font.size = Pt(14)
            continue

        # Bullet points ( or - )
        if line.startswith("") or line.startswith("- "):
            bullet_text = line.lstrip("- ").strip()
            doc.add_paragraph(bullet_text, style='List Bullet')
            continue

        # Bold keys in key-value pairs
        if ":" in line and line.count(":") == 1 and line.index(":") < 30:
            key, value = line.split(":", 1)
            para = doc.add_paragraph()
            run = para.add_run(key.strip() + ": ")
            run.bold = True
            para.add_run(value.strip())
            continue

        # Bold text inside **double asterisks**
        if "**" in line:
            para = doc.add_paragraph()
            parts = line.split("**")
            for i, part in enumerate(parts):
                run = para.add_run(part)
                if i % 2 == 1:
                    run.bold = True
            continue

        # Default paragraph
        doc.add_paragraph(line)

    doc.save(filename)
    print(f" CV saved as {filename}")

def save_as_pdf(text, filename="generated_cv.pdf"):
    #replace en dash and other problematic Unicode characters with hyphen
    text = text.replace("\u2013", "-")  # En dash to hyphen
    text = text.replace("\u2014", "-")  # Em dash to hyphen
    text = text.replace("–", "-")
    text = text.replace("—", "-")

#create new pdf
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_font("Arial", size=12)

    lines = text.split('\n') #splits the input text into lines for processing
    for line in lines:
        line = line.strip() #remove unwanted spacing
        if not line:
            pdf.ln(5)
        elif line.startswith("**") and line.endswith("**"): #makes lines with ** as headers
            pdf.set_font("Arial", 'B', 12)
            pdf.cell(0, 10, line.strip("*"), ln=True)
            pdf.set_font("Arial", '', 12)
        elif line.startswith("- "): #converts lines with - as bullet pts
            pdf.multi_cell(0, 10, "- " + line[2:])
        else:
            pdf.multi_cell(0, 10, line)

    pdf.output(filename)
    print(f"CV saved as {filename}")