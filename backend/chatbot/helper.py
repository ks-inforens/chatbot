import re

def clean_json(s):
    s = re.sub(r',\s*([}\]])', r'\1', s)
    return s

def remove_citations(text):
    return re.sub(r'\[\d+\]', '', text).strip()
