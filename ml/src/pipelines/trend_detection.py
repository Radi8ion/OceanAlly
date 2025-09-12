import os
from datetime import datetime
from typing import List, Dict
from bertopic import BERTopic
from ..schemas.analysis import TrendAnalysis, TrendTopic
from ..nlp.preprocessing import normalize_text
from ..models.sentiment import SentimentService
from ..config import Config

HAZARD_KEYWORDS = {
    "tsunami": ["tsunami", "सुनामी", "সুনামি", "சுனாமி", "సునామి"],
    "storm_surge": ["storm surge", "ঝড়ো ঢেউ", "तूफानी ज्वार"],
    "high_waves": ["high waves", "उच्च तरंग", "উঁচু ঢেউ"],
    "flooding": ["coastal flooding", "बाढ़", "বন্যা"],
    "swell_surge": ["swell", "स्वेल", "সোয়েল"],
    "coastal_current": ["rip current", "coastal current"],
    "coastal_erosion": ["coastal erosion", "कटाव", "ভূক্ষয়"],
}

def _load_or_init_topic_model(path: str) -> BERTopic:
    if os.path.exists(path):
        try:
            return BERTopic.load(path)
        except Exception:
            pass
    # Multilingual embeddings as recommended for mixed-language corpora
    return BERTopic(language="multilingual")

def detect_trends(posts: List[str]) -> TrendAnalysis:
    cfg = Config()
    topic_model = _load_or_init_topic_model(cfg.BER_TOPIC_PATH)
    sent = SentimentService()

    docs = [normalize_text(p) for p in posts if p and p.strip()]
    if not docs:
        return TrendAnalysis(trending_hazards=[], total_posts_analyzed=0, timestamp=datetime.utcnow().isoformat())

    topics, _ = topic_model.fit_transform(docs)
    info = topic_model.get_topic_info()

    trending: List[TrendTopic] = []
    # For top frequent topics
    for _, row in info.head(10).iterrows():
        topic_id = int(row["Topic"])
        if topic_id == -1:
            continue
        words = [w for w, _ in topic_model.get_topic(topic_id)[:5]]
        # Simple rule-based hazard mapping
        hazard = None
        for h, kws in HAZARD_KEYWORDS.items():
            if any(any(kw.lower() in w.lower() for kw in kws) for w in words):
                hazard = h
                break

        # Aggregate sentiment for docs in this topic
        indices = [i for i, t in enumerate(topics) if t == topic_id]
        topic_texts = [docs[i] for i in indices]
        # Average sentiment
        agg = {"neg": 0.0, "neu": 0.0, "pos": 0.0, "compound": 0.0}
        for t in topic_texts:
            s = sent.score(t)
            for k in agg: agg[k] += s[k]
        n = max(len(topic_texts), 1)
        for k in agg: agg[k] /= n

        trending.append(TrendTopic(
            hazard_type=hazard,
            keywords=words[:5],
            frequency=len(indices),
            sentiment=agg
        ))

    # Save model for reuse
    try:
        os.makedirs(cfg.BER_TOPIC_PATH, exist_ok=True)
    except Exception:
        pass
    try:
        topic_model.save(cfg.BER_TOPIC_PATH)
    except Exception:
        pass

    return TrendAnalysis(
        trending_hazards=trending,
        total_posts_analyzed=len(docs),
        timestamp=datetime.utcnow().isoformat()
    )
