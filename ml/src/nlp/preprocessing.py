import re
import langid
from unidecode import unidecode

URL_RE = re.compile(r"https?://\S+")
MENTION_RE = re.compile(r"[@#]\w+")
EXTRA_WS_RE = re.compile(r"\s+")

def clean_text(text: str) -> str:
    text = URL_RE.sub(" ", text)
    text = MENTION_RE.sub(" ", text)
    text = text.replace("\n", " ")
    text = EXTRA_WS_RE.sub(" ", text).strip()
    return text

def detect_language(text: str) -> str:
    lang, _ = langid.classify(text)
    return lang

def normalize_text(text: str) -> str:
    # Keep accents for Indic scripts as HF suggests when tokenizing IndicBERT
    # optionally unify punctuation and remove artifacts
    return clean_text(text)

def prepare(text: str):
    text = normalize_text(text)
    lang = detect_language(text)
    return text, lang
