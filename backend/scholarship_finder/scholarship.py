import requests
import json
import re
from perplexity_api import AGENT_API_URL, agent_output_text, build_agent_payload

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

#Enforced at the API level so the model can't wrap the JSON in prose or markdown,
#which the prompt alone only asks for politely.
SCHOLARSHIP_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "scholarships": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "description": {"type": "string"},
                    "deadline": {"type": "string"},
                },
                "required": ["name", "description", "deadline"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["scholarships"],
    "additionalProperties": False,
}

SCHOLARSHIP_MAX_TOKENS = 1500

def salvage_scholarships(text):
    #A token-limit cut leaves the "scholarships" array unclosed, so json.loads rejects
    #the whole payload. Walk the array instead and keep every entry that was fully
    #written rather than failing a request that did produce usable results.
    marker = re.search(r'"scholarships"\s*:\s*\[', text or "")
    if not marker:
        return []

    decoder = json.JSONDecoder()
    items = []
    i = marker.end()
    while i < len(text):
        start = text.find('{', i)
        if start == -1:
            break
        try:
            obj, end = decoder.raw_decode(text, start)
        except ValueError:
            break  #this is the entry that got cut off
        if isinstance(obj, dict) and obj.get("name"):
            items.append(obj)
        i = end
    return items

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

def _request_scholarships(prompt):
    #Single place that owns the Perplexity call. Raises requests exceptions so the
    #caller keeps its own error mapping.
    from flask import current_app
    headers = {
        "Authorization": f"Bearer {current_app.config.get('SCHOLARSHIP_FINDER_API_KEY')}",
        "Content-Type": "application/json"
    }
    #NOTE: do not add a "reasoning" effort here. "sonar" is not a reasoning model, and
    #sending it made the API answer 200 OK with an EMPTY completion (completion_tokens=0)
    #about three times out of four, and roughly 3x slower. That was the cause of the
    #"We could not find your scholarships at this time!" message users were seeing.
    payload = build_agent_payload(
        [{"role": "user", "content": prompt}],
        max_output_tokens=SCHOLARSHIP_MAX_TOKENS,
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "scholarship_list",
                "schema": SCHOLARSHIP_JSON_SCHEMA
            }
        },
    )

    response = requests.post(AGENT_API_URL, json=payload, headers=headers, timeout=30)
    response.raise_for_status()
    return agent_output_text(response.json())

def fetch_scholarships(prompt):
    try:
        content = _request_scholarships(prompt)

        #An empty completion still slips through occasionally; one retry is far cheaper
        #than sending the user away empty-handed.
        if not content or not content.strip():
            print("Empty completion from Perplexity, retrying once.")
            content = _request_scholarships(prompt)

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
        except json.JSONDecodeError: #invalid json, usually a token-limit cut
            recovered = salvage_scholarships(content)
            if recovered:
                print(f"Recovered {len(recovered)} scholarship(s) from a truncated response.")
                return {"scholarships": recovered, "error": None}
            return {
                "scholarships": [],
                "error": "We ran into an issue while finding scholarships. Please try again shortly."
            }

        if not isinstance(parsed, dict) or not isinstance(parsed.get("scholarships"), list):
            #Wrong shape entirely, or the list arrived truncated inside a valid-looking
            #object; take whatever complete entries the model did produce.
            recovered = salvage_scholarships(content)
            if recovered:
                print(f"Recovered {len(recovered)} scholarship(s) from a malformed response.")
                return {"scholarships": recovered, "error": None}
            return {
                "scholarships": [],
                "error": "We couldn’t find valid scholarships for your profile. Please try again."
            }

        # success
        return {
            "scholarships": parsed["scholarships"],
            "error": None
        }

    except requests.exceptions.HTTPError as e:
        #HTTPError subclasses RequestException, so without this branch a 401 (bad or
        #missing SCHOLARSHIP_FINDER_API_KEY) was reported to users as a connection problem.
        print(f"Perplexity API returned an HTTP error: {e}")
        return {
            "scholarships": [],
            "error": "We're having trouble finding scholarships right now. Please try again in a moment."
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