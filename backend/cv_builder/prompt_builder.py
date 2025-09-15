def build_prompt_CV(user_data, raw_text=None):
    schema = """
{
  "full_name": "",
  "contact": {
    "location": "",
    "email": "",
    "phone": "",
    "linkedin": ""
  },
  "sections": {
    "Professional Statement": "",
    "Work Experience": [
      {
        "title": "",
        "company": "",
        "location": "",
        "dates": "",
        "responsibilities": []
      }
    ],
    "Education": [
      {
        "degree": "",
        "field": "",
        "institution": "",
        "dates": "",
        "result": ""
      }
    ],
    "Skills": [],
    "Projects": [],
    "Certificates": []
    "Additional sections": []
  }
}
"""

    if raw_text:
        prompt = f"""
You are an expert CV parser and formatter.
Extract structured information from the following CV text.

⚠️ Rules:
- Return ONLY valid JSON in the schema below.
- If Professional Statement is missing, generate a concise professional summary suitable for the target country: {user_data.get('target_country', '')}.
- If any new sections exist in the CV (e.g., Languages, Positions of Responsibility), include them in JSON.
- If information is missing, leave the field empty, do not fabricate.
- Respect the JSON structure exactly as shown.

Schema:
{schema}

CV Text:
\"\"\" 
{raw_text}
\"\"\"
"""
    else:
        prompt = f"""
You are an expert CV generator. Use the provided information to create a professional CV.\n
Ensure that the CV is highly ATS-friendly and has a human written tone. \n
Incorporate strong action verbs, especially for leadership roles, such as these power action verbs:\n 
- Leadership: spearheaded, managed, orchestrated. \n
- Results: acheived, generated, maximised. \n
- Innovation: designed, implemented, streamlined.\n
These are just a handful of examples.\n
Include quantifiable results where possible.\n
Also, write a professional summary highlighting my goals ONLY IF I have work experience (if no work experience is mentioned, do NOT include a professional summary).\n  

⚠️ Rules:
- Return ONLY valid JSON in the schema below.
- Generate a Professional Statement based on user data if missing.
- Respect the JSON structure exactly as shown.
- If information is missing, leave the field empty, do not fabricate.

Schema:
{schema}

User Data:
{user_data}
"""

    return prompt