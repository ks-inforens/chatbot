import requests
import json
import re

def extract_json_object(text):
    if not text:
        return None
    
    #remove markdown code blocks
    text = re.sub(r'^```(?:json)?\s*', '', text.strip())
    text = re.sub(r'```\s*$', '', text.strip())
    
    #find the first { and last }
    start = text.find('{')
    end = text.rfind('}')
    
    if start == -1 or end == -1:
        return None
    
    return text[start:end+1]

def clean_json(text):

    if not text:
        return text
    
    # Remove trailing commas before closing braces/brackets
    text = re.sub(r',(\s*[}\]])', r'\1', text)
    
    return text.strip()

def get_user_details():
    print("Please enter your details below.")
    citizenship = input("Country of citizenship: ")
    preferred_country = input("Preferred country for study: ")
    level = input("Level of study (Undergraduate, Postgraduate, PhD): ")

    uni_input = input("Preferred university/universities (comma-separated, press Enter to skip): ")
    preferred_universities = [u.strip() for u in uni_input.split(",")] if uni_input else []

    field = input("Field of study (e.g. Data Science, Engineering): ")
    course_intake = input("Course intake (e.g. September 2025) (optional, press Enter to skip): ")
    academic_perf = input("Current/previous academic performance (GPA, % or degree class) (optional, press Enter to skip): ")
    age = input("Age (optional, press Enter to skip): ")
    gender = input("Gender (optional, press Enter to skip): ")
    disability = input("Disability status (optional, press Enter to skip): ")
    extracurricular = input("Any extracurricular activities (e.g. sports) (optional, press Enter to skip): ")

    return {
        "citizenship": citizenship,
        "preferred_country": preferred_country,
        "level": level,
        "preferred_universities": preferred_universities,
        "field": field,
        "course_intake": course_intake if course_intake else None,
        "academic_perf": academic_perf if academic_perf else None,
        "age": age if age else None,
        "gender": gender if gender else None,
        "disability": disability if disability else None,
        "extracurricular": extracurricular if extracurricular else None,
    }

def build_prompt(user):
    lines = [
        "You are an expert on global scholarships. A student has provided their profile details:\n",
    ]

    if isinstance(user.get("preferred_universities"), str):
        user["preferred_universities"] = [user["preferred_universities"]]
    if user.get('citizenship'):
        lines.append(f"Citizenship: {user['citizenship']}")
    if user.get('level'):
        lines.append(f"Desired level of study: {user['level']}")
    if user.get('field'):
        lines.append(f"Preferred field of study: {user['field']}")
    if user.get('academic_perf'):
        lines.append(f"Academic performance: {user['academic_perf']}")
    if user.get('disability'):
        lines.append(f"Disability: {user['disability']}")
    if user.get('preferred_country'):
        lines.append(f"Preferred country of study: {user['preferred_country']}")
    if user.get('preferred_universities'):
        lines.append(f"Preferred university: {user['preferred_universities']}")
    if user.get('course_intake'):
        lines.append(f"Course intake: {user['course_intake']}")
    if user.get('dob'):
        lines.append(f"Date of Birth: {user['dob']}")
    if user.get('gender'):
        lines.append(f"Gender: {user['gender']}")
    activities = user.get("activity") or user.get("extracurricular")
    if isinstance(activities, list):
        desc = activities[0].get("description")
        if desc:
            lines.append(f"Extracurricular activities: {desc}")
    elif isinstance(activities, str) and activities.strip():
        lines.append(f"Extracurricular activities: {activities}")

    lines.append("""
Based on this information, recommend relevant scholarships for this student. If no exact matches exist, recommend the closest applicable international scholarships.
Do NOT return an empty list unless no scholarships exist worldwide.
Respond ONLY with a SINGLE valid JSON object with a key "scholarships" whose value is an array of objects, each object has:
  - "name": Name of the scholarship.
  - "description": A SHORT description of the scholarship, maximum 20 words.
  - "deadline": Deadline of the scholarship (approximate)

Example output:
{
  "scholarships": [
    {
      "name": "Commonwealth Scholarship",
      "description": "Covers tuition and living expenses for postgraduate study in the UK for students from eligible Commonwealth countries.",
      "deadline": "Dec 12, 2025 (mmm dd, yyyy format)"
    },
    {
      "name": "...",
      "description": "...",
      "deadline": "... (mmm dd, yyyy format)"
    }
  ]
}

The scholarships recommended must be relevant to the student's profile.
Do not add any explanations or text before or after the JSON.
Ensure the JSON you return is syntactically valid and parseable.
""")

    return "\n".join(lines)

def fetch_scholarships(prompt):
    from flask import current_app
    url = "https://api.perplexity.ai/chat/completions"
    headers = {
        "Authorization": f"Bearer {current_app.config.get("SCHOLARSHIP_FINDER_API_KEY")}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "sonar",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1000,
        "reasoning_effort": "medium"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]

        print("RAW PERPLEXITY OUTPUT:\n", content)
        #if empty / none / whitespace output from perplexity
        if not content or not content.strip():
            return {
                "scholarships": [],
                "error": "Something went wrong. Please try again."
            }
        
        extracted = extract_json_object(content) #extract json object

        #if no json object extracted from perplexity
        if not extracted:
            return {
                "scholarships": [],
                "error": "Something went wrong. Please try again shortly."
            }
        
        cleaned = clean_json(extracted)

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError: #invalid json
            return {
                "scholarships": [],
                "error": "We ran into an issue while finding scholarships. Please try again shortly."
            }
        
        if not isinstance(parsed, dict) or "scholarships" not in parsed: #to handle random structure in json
            return {
                "scholarships": [],
                "error": "We couldn’t find valid scholarships for your profile. Please try again."
            }

        if not isinstance(parsed["scholarships"], list): #ensure scholarships is actually a list
            return {
                "scholarships": [],
                "error": "We couldn’t find valid scholarships for your profile. Please try again."
            }

        # success
        return {
            "scholarships": parsed["scholarships"],
            "error": None
        }

    except requests.exceptions.RequestException: #perplexity not reachable
        return {
            "scholarships": [],
            "error": "Unable to connect right now. Please check your connection and try again."
        }

    except Exception:  #other exceptions
        return {
            "scholarships": [],
            "error": "Something went wrong on our side. Please try again shortly."
        }

if __name__ == "__main__":
    user_data = get_user_details()
    prompt = build_prompt(user_data)
    fetch_scholarships(prompt)