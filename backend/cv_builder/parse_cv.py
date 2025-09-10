import re
from docx import Document
import pdfplumber
from cv_builder.generate_cv import call_perplexity

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
    prompt = f"""
                Given this heap of text collected from an existing uploaded CV:\n{text}\n\n
                Can you return a clearly structured json resopnse such that the jsonify(your_output) function can be used to convert your response to a proper json object. Include fields in this format:\n
                full_name: full name of the user\n
                email: user email\n
                phone: user phone number in country code format (e.g. +44 ... for UK)\n
                linkedin: user's linkedIn URL\n
                location: user's location in the format City, Country (e.g. London, UK)\n
                work_experience: this should be an array of dictionaries contaning these following fields\n
                -> type_of_work: out of 3 options - internship, part-time or full-time\n
                -> job_title: the title of the job (e.g. Product Manager)\n
                -> company_name: the name of the company they worked for\n
                -> start_date: when they started work in mm/dd/yyyy format\n
                -> end_date: when they ended work in mm/dd/yyyy format or 'Present' for still working\n 
                -> responsibilities: list of roles or responsibilities they had in the job (separated by commahs)\n 
                -> achievements: list of achievements or accomplishments within the job (separated by commahs)\n
                education: this should be an array of dictionaries containing these following fields\n
                -> university_name: name of school/university they received the qualification/degree from\n
                -> start_date: when they started their education in that specific institution in mm/dd/yyyy format\n
                -> end_date: when they ended their education in that specific institution in mm/dd/yyyy format or 'Present' for still studying\n
                -> relevant_coursework: name of the degree or coursework included within the qualification\n
                -> achievements: results of the qualification\n
                skills: this should be a single dictionary containing these following fields\n
                -> technical_skills: list of technical skills separated by a commah (e.g. Java, Python, C++)\n
                -> soft_skills: list of soft skills separated by a commah (e.g. Communication, Teamwork)\n
                languages_known: this should be a list of dictionaries containing these following fields\n
                -> language: the name of the language (e.g. French)
                -> proficiency: the proficiency given these fixed 4 options - 'Beginner', 'Intermediate', 'Advanced', 'Native'\n
                certifications: this should be a list of dictionaries with these following fields\n
                -> name: name of the certification\n
                -> organisation: name of the issuing organisation of the certification\n
                -> date: the date they obtained the certification in mm/dd/yyyy format\n
                projects: this should be a list of dictionaries with these following fields\n
                -> title: the name/title of the project\n
                -> link: the URL link to the project in https:// format\n
                -> description: a short description of the project\n\n
                If any of the fields are missing, assign the field with a 'null' value.\n
                Strictly start and end the response with a curly bracket, do not include any other characters or text in the start or end.
            """
    
    return call_perplexity(prompt)
    # info = {}

    # #normalize text for easier parsing
    # text = text.replace("\r", "\n") #replace \r with \n
    # lines = [line.strip() for line in text.split("\n") if line.strip()] #make the text clean and easy for machine to understand
    # full_text = "\n".join(lines)

    # #personal info
    # info['full_name'] = lines[0] if lines else "" #first line is name
    # info['email'] = extract_regex(r"[\w\.-]+@[\w\.-]+", full_text) #extract email address using regular expression example@example.com
    # info['phone'] = extract_regex(r"\+?\d[\d\s\-\(\)]{7,}", full_text) #extract phone number using regular expression formats like "+" "(123)" "123-456"
    # info['linkedin'] = extract_regex(r"(https?://(www\.)?linkedin\.com/[^\s]+)", full_text) #extract linkedin url
    # info['location'] = extract_location(lines)

    # #parse sections
    # sections = split_into_sections(full_text)

    # #workex
    # work_exp_text = sections.get("work experience", "") or sections.get("experience", "") #sections is a dict, get work experience from that
    # info['work_experience'] = parse_work_experience(work_exp_text)

    # #education
    # education_text = sections.get("education", "")
    # info['education'] = parse_education(education_text)

    # #skills
    # skills_text = sections.get("skills", "")
    # info['skills'] = parse_skills(skills_text)

    # #Projects
    # projects_text = sections.get("projects", "")
    # info['projects'] = parse_projects(projects_text)

    # #certificates and Awards
    # certs_text = sections.get("certificates and awards", "") or sections.get("certifications", "")
    # info['certificates'] = parse_certificates(certs_text)

    # return info

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
