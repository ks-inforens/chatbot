import json
import re

def clean_json(s):
    s = re.sub(r',\s*([}\]])', r'\1', s)
    return s

def remove_citations(text):
    return re.sub(r'\[\d+\]', '', text).strip()

#A sentence terminator that is actually followed by whitespace/end, so decimals
#and abbreviations inside a number like "1.5" don't count as an ending.
SENTENCE_END_RE = re.compile(r'[.!?](?=[\s"\')\]]|$)')

#Below this ratio the salvaged text would lose too much to be worth trimming,
#so an ugly mid-word cut is preferred over throwing most of the answer away.
MIN_TRIM_RATIO = 0.5


def extract_json_string_field(text, field):
    #Recovers a top-level JSON string value even when the surrounding object was
    #cut off mid-value (the model hit its token ceiling). Walks the string by hand
    #so an escaped quote inside the answer doesn't terminate it early.
    marker = re.search(r'"%s"\s*:\s*"' % re.escape(field), text)
    if not marker:
        return None

    buf = []
    escaped = False
    for ch in text[marker.end():]:
        if escaped:
            buf.append(ch)
            escaped = False
        elif ch == '\\':
            buf.append(ch)
            escaped = True
        elif ch == '"':
            break
        else:
            buf.append(ch)
    raw = ''.join(buf)

    #A cut can land inside an escape sequence (a dangling backslash or a
    #half-written unicode escape), which json would reject. Shave characters until the
    #remainder decodes; give up after a few tries rather than mangling the text.
    for _ in range(8):
        if not raw:
            return None
        try:
            return json.loads('"%s"' % raw)
        except ValueError:
            raw = raw[:-1]
    return None


def trim_to_last_sentence(text):
    #Truncated answers end mid-word; cut back to the last complete sentence unless
    #that would discard most of what we recovered.
    text = text.strip()
    matches = list(SENTENCE_END_RE.finditer(text))
    if not matches:
        return text
    trimmed = text[:matches[-1].end()].strip()
    if len(trimmed) < len(text) * MIN_TRIM_RATIO:
        return text
    return trimmed
