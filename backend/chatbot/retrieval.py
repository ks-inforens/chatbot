import re
import math
from collections import Counter
from dataclasses import dataclass, field

# The scraped content file separates pages with lines like:
# --https://www.inforens.com/some-page--
PAGE_DELIMITER_RE = re.compile(r"^--(\S+)--\s*$", re.MULTILINE)

# Individual blog posts inside the oversized /blogs page are separated by a
# "DD/MM/YYYY N min read" marker immediately followed by the post title.
BLOG_POST_SPLIT_RE = re.compile(r"\d{2}/\d{2}/\d{4}\s+\d+\s+min read")

# Any page above this size gets split further (data-driven, not hardcoded to
# the /blogs URL specifically) so a single mega-page can't dominate/blow the
# prompt budget and its sub-topics become individually retrievable.
LARGE_PAGE_THRESHOLD = 20_000

DEFAULT_FALLBACK_URL = "https://www.inforens.com/contact-us"

STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "and", "or", "but", "if", "of", "at", "by", "for", "with", "about",
    "to", "from", "in", "on", "into", "as", "i", "you", "it", "this",
    "that", "my", "me", "do", "does", "did", "can", "could", "will",
    "would", "should", "what", "how", "when", "where", "which", "who",
}


@dataclass
class Chunk:
    url: str
    text: str


def load_chunks(content_file_path):
    try:
        with open(content_file_path, "r", encoding="utf-8") as f:
            text = f.read()
    except FileNotFoundError:
        print(f"Content file not found: {content_file_path}")
        return []

    matches = list(PAGE_DELIMITER_RE.finditer(text))
    chunks = []
    for i, m in enumerate(matches):
        url = m.group(1)
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        page_text = text[start:end].strip()
        if not page_text:
            continue
        if len(page_text) > LARGE_PAGE_THRESHOLD:
            chunks.extend(_split_large_page(url, page_text))
        else:
            chunks.append(Chunk(url=url, text=page_text))
    return chunks


def _split_large_page(url, page_text):
    post_matches = list(BLOG_POST_SPLIT_RE.finditer(page_text))
    if not post_matches:
        return [Chunk(url=url, text=page_text)]

    sub_chunks = []
    for i, m in enumerate(post_matches):
        start = m.end()
        end = post_matches[i + 1].start() if i + 1 < len(post_matches) else len(page_text)
        post_text = page_text[start:end].strip()
        if post_text:
            sub_chunks.append(Chunk(url=url, text=post_text))
    return sub_chunks if sub_chunks else [Chunk(url=url, text=page_text)]


def known_urls(chunks):
    return {c.url for c in chunks}


def _tokenize(text):
    return [t for t in re.findall(r"[a-z0-9]+", text.lower()) if len(t) > 1 and t not in STOPWORDS]


@dataclass
class BM25Index:
    chunks: list
    doc_tokens: list = field(default_factory=list)   # Counter per chunk
    doc_lens: list = field(default_factory=list)      # token count per chunk
    doc_freqs: Counter = field(default_factory=Counter)  # term -> #chunks containing it
    avg_len: float = 0.0
    n: int = 0


def build_index(chunks):
    index = BM25Index(chunks=chunks)
    for c in chunks:
        tokens = _tokenize(c.text)
        counts = Counter(tokens)
        index.doc_tokens.append(counts)
        index.doc_lens.append(len(tokens))
        for term in counts:
            index.doc_freqs[term] += 1
    index.n = len(chunks)
    index.avg_len = (sum(index.doc_lens) / index.n) if index.n else 0.0
    return index


def score(question, index, k1=1.5, b=0.75):
    if index.n == 0:
        return []
    q_terms = set(_tokenize(question))
    if not q_terms:
        return []

    scores = [0.0] * index.n
    for term in q_terms:
        df = index.doc_freqs.get(term, 0)
        if df == 0:
            continue
        idf = math.log(1 + (index.n - df + 0.5) / (df + 0.5))
        for i in range(index.n):
            tf = index.doc_tokens[i].get(term, 0)
            if tf == 0:
                continue
            dl = index.doc_lens[i] or 1
            denom = tf + k1 * (1 - b + b * dl / (index.avg_len or 1))
            scores[i] += idf * (tf * (k1 + 1)) / denom

    ranked = [(index.chunks[i], scores[i]) for i in range(index.n) if scores[i] > 0]
    ranked.sort(key=lambda pair: pair[1], reverse=True)
    return ranked


def top_k(question, index, k=4):
    return [chunk for chunk, _ in score(question, index)[:k]]


def validate_links(links, known_url_set, fallback=DEFAULT_FALLBACK_URL):
    def normalize(u):
        return u.strip().rstrip(").,;").rstrip("/")

    canonical_by_norm = {}
    for u in known_url_set:
        canonical_by_norm.setdefault(normalize(u), u)

    result = []
    seen = set()
    for link in links or []:
        if not isinstance(link, str):
            continue
        canonical = canonical_by_norm.get(normalize(link))
        if canonical and canonical not in seen:
            result.append(canonical)
            seen.add(canonical)

    return result if result else [fallback]
