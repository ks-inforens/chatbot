#call perplexity
import requests
import os
from dotenv import load_dotenv
import json
from perplexity_api import AGENT_API_URL, agent_output_text, build_agent_payload

load_dotenv()
PERPLEXITY_API_KEY = os.getenv("CV_BUILDER_API_KEY", "").strip()

CV_JSON_SCHEMA = {
    "schema": {
        "type": "object",
        "properties": {
            "additionalSec": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "desc": {"type": "string"},
                        "title": {"type": "string"}
                    },
                    "required": ["desc", "title"]
                }
            },
            "certifications": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "date": {"type": "string"},
                        "name": {"type": "string"},
                        "organisation": {"type": "string"},
                        "type": {"type": "string"}
                    },
                    "required": ["name"]
                }
            },
            "education": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "country": {"type": "string"},
                        "course": {"type": "string"},
                        "discipline": {"type": "string"},
                        "level": {"type": "string"},
                        "location": {"type": "string"},
                        "region": {"type": "string"},
                        "results": {"type": "string"},
                        "start_date": {"type": "string"},
                        "end_date": {"type": "string"},
                        "university_name": {"type": "string"}
                    }
                }
            },
            "email": {"type": "string"},
            "full_name": {"type": "string"},
            "languages_known": {
                "type": "array",
                "items": {"type": "string"}
            },
            "links": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "url": {"type": "string"}
                    }
                }
            },
            "location": {"type": "string"},
            "phone": {"type": "string"},
            "projects": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "description": {"type": "string"},
                        "link": {"type": "string"},
                        "title": {"type": "string"},
                        "type": {"type": "string"}
                    }
                }
            },
            "skills": {
                "type": "array",
                "items": {"type": "string"}
            },
            "work_experience": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "achievements": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "company_name": {"type": "string"},
                        "start_date": {"type": "string"},
                        "end_date": {"type": "string"},
                        "job_title": {"type": "string"},
                        "responsibilities": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "type_of_work": {"type": "string"}
                    }
                }
            }
        },
        "required": ["full_name"]
    }
}

def call_perplexity(prompt):
    headers = {
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = build_agent_payload(
        [{"role": "user", "content": prompt}],
        response_format={
            "type": "json_schema",
            "json_schema": CV_JSON_SCHEMA
        },
    )

    response = requests.post(AGENT_API_URL, json=payload, headers=headers)

    #not able to reach
    if response.status_code != 200:
        raise Exception("LLM_UNAVAILABLE")

    data = response.json()

    content = agent_output_text(data)

    #empty content
    if not content or not content.strip():
        raise Exception("EMPTY_MODEL_RESPONSE")

    #invalid JSON
    try:
        json.loads(content)
    except Exception:
        raise Exception("INVALID_MODEL_OUTPUT")

    return content