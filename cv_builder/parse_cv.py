import re
from docx import Document
import pdfplumber

#extract text from pdf
def extract_info_from_pdf(file_path):
    with pdfplumber.open(file_path) as pdf:
        text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    return extract_info_from_text(text)

#extract text from doc
def extract_info_from_docx(file_path):
    doc = Document(file_path)
    text = "\n".join(p.text for p in doc.paragraphs)
    return extract_info_from_text(text)

#extract required data from extracted text
def extract_info_from_text(text):
    info = {}

    #normalize text for easier parsing
    text = text.replace("\r", "\n") #replace \r with \n
    lines = [line.strip() for line in text.split("\n") if line.strip()] #make the text clean and easy for machine to understand
    full_text = "\n".join(lines)

    #personal info
    info['full_name'] = lines[0] if lines else "" #first line is name
    info['email'] = extract_regex(r"[\w\.-]+@[\w\.-]+", full_text) #extract email address using regular expression example@example.com
    info['phone'] = extract_regex(r"\+?\d[\d\s\-\(\)]{7,}", full_text) #extract phone number using regular expression formats like "+" "(123)" "123-456"
    info['linkedin'] = extract_regex(r"(https?://(www\.)?linkedin\.com/[^\s]+)", full_text) #extract linkedin url
    info['location'] = extract_location(lines)

    #parse sections
    sections = split_into_sections(full_text)

    #workex
    work_exp_text = sections.get("work experience", "") or sections.get("experience", "") #sections is a dict, get work experience from that
    info['work_experience'] = parse_work_experience(work_exp_text)

    #education
    education_text = sections.get("education", "")
    info['education'] = parse_education(education_text)

    #skills
    skills_text = sections.get("skills", "")
    info['skills'] = parse_skills(skills_text)

    #Projects
    projects_text = sections.get("projects", "")
    info['projects'] = parse_projects(projects_text)

    #certificates and Awards
    certs_text = sections.get("certificates and awards", "") or sections.get("certifications", "")
    info['certificates'] = parse_certificates(certs_text)

    return info

def extract_regex(pattern, text, group=0):
    match = re.findall(pattern, text, re.IGNORECASE)
    return match[0] if match else None

def extract_location(lines):
    for i, line in enumerate(lines):
        if any(keyword in line.lower() for keyword in ['city', 'country', 'location', 'address']): #check if it contains these keywords
            return line
        if "@" in line or re.search(r"\+?\d[\d\s\-\(\)]{7,}", line): #check if the line contains mail using "@"
            return lines[i+1] if i+1 < len(lines) else line
    return "Unknown"


def split_into_sections(text):
    #split text into sections by common headers (case insensitive)
    headers = [
        "work experience",
        "experience",
        "education",
        "skills",
        "projects",
        "certificates and awards",
        "certifications",
        "awards"
    ]
    sections = {}
    current_section = None
    buffer = []

    lines = text.split("\n")

    for line in lines:
        line_lower = line.lower().strip()
        if line_lower in headers:
            if current_section and buffer:
                sections[current_section] = "\n".join(buffer).strip()
                buffer = []
            current_section = line_lower
        else:
            if current_section:
                buffer.append(line)

    # add last section
    if current_section and buffer:
        sections[current_section] = "\n".join(buffer).strip()

    return sections

def parse_work_experience(text):
    #split by job entries, assuming jobs are separated by 1 or 2 blank lines
    jobs = re.split(r"\n\s*\n", text.strip())
    experiences = []

    for job in jobs:
        lines = job.split("\n")
        if len(lines) < 2:
            continue

        #first line may have title and company
        title_company = lines[0]
        dates = extract_regex(r"(\b\d{4}[-/]\d{4}|\b\d{4}[-/]\bPresent|\bPresent|\b\d{4})", job) or ""

        #attempt to find job type (internship, part-time, full-time)
        job_type = None
        if re.search(r"\bintern(ship)?\b", job, re.I):
            job_type = "Internship"
        elif re.search(r"\bpart[- ]?time\b", job, re.I):
            job_type = "Part-time"
        else:
            job_type = "Full-time"

        #responsibilities and achievements
        responsibilities = []
        if len(lines) > 1:
            responsibilities = lines[1:]

        experiences.append({
            "job_title_and_company": title_company,
            "dates": dates,
            "job_type": job_type,
            "responsibilities_achievements": responsibilities
        })
    return experiences

def parse_education(text):
#split by education entries, assuming each education is separated by 1 or 2 blank lines
    entries = re.split(r"\n\s*\n", text.strip())
    education_list = []
    for entry in entries:
        lines = entry.split("\n")
        if len(lines) < 1:
            continue
#first line may have school or uni name
        school = lines[0]
        dates = extract_regex(r"(\b\d{4}[-/]\d{4}|\b\d{4}[-/]\bPresent|\bPresent|\b\d{4})", entry) or "" #extract dates
        coursework = None
        if len(lines) > 1:
            #look for lines containing coursework keywords
            for l in lines[1:]:
                if re.search(r"(coursework|subjects|modules|relevant)", l, re.I):
                    coursework = l
                    break

        education_list.append({
            "institution": school,
            "dates": dates,
            "relevant_coursework": coursework
        })
    return education_list

def parse_skills(text):
    #split by commas or line breaks
    skills = []
    if not text:
        return skills
    #remove skill section headers if any left
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    for line in lines:
        if "," in line:
            skills.extend([s.strip() for s in line.split(",")])
        else:
            skills.append(line)
    return skills

def parse_projects(text):
##split by project entries, assuming each project is separated by 1 or 2 blank lines
    entries = re.split(r"\n\s*\n", text.strip())
    projects = []
    for entry in entries:
        lines = entry.split("\n")
        if len(lines) == 0:
            continue
#first line may have title of the project
        title = lines[0]
        description = None
        link = None

        for l in lines[1:]:
            if re.search(r"https?://", l): #try to search for link of the project
                link = l.strip()
            else:
                description = (description or "") + l + " " #if not, description

        projects.append({
            "title": title,
            "description": (description or "").strip(),
            "link": link
        })
    return projects

def parse_certificates(text):
##split by certificate entries, assuming each certificate is separated by 1 or 2 blank lines
    entries = re.split(r"\n\s*\n", text.strip())
    certificates = []
    for entry in entries:
        lines = entry.split("\n")
        if len(lines) == 0:
            continue
#first line may contain name
        name = lines[0]
        issuing_org = None
        date = None

        #simple heuristics for org and date
        for l in lines[1:]:
            if re.search(r"\b\d{4}\b", l):
                date = l.strip()
            else:
                issuing_org = (issuing_org or "") + l + " "

        certificates.append({
            "name": name,
            "issuing_organization": (issuing_org or "").strip(),
            "date_obtained": date
        })
    return certificates
