from typing import Dict

HAZARD_BASE_URGENCY = {
    "tsunami": 0.9, "storm_surge": 0.8, "high_waves": 0.7,
    "coastal_current": 0.5, "swell_surge": 0.6, "flooding": 0.8,
    "coastal_erosion": 0.4, "other": 0.3
}

def compute_urgency(hazard_probs: Dict[str, float], sentiment: Dict[str, float], engagement: Dict[str, float] | None) -> float:
    top = max(hazard_probs, key=hazard_probs.get)
    base = HAZARD_BASE_URGENCY.get(top, 0.5)
    sent_factor = 1.0 + abs(sentiment.get("compound", 0)) if sentiment.get("compound", 0) < 0 else 1.0
    eng_rt = (engagement or {}).get("retweet_count") or (engagement or {}).get("retweets") or 0
    eng_factor = min(1.0 + (eng_rt / 200.0), 2.0)
    score = base * sent_factor * eng_factor
    return float(min(score, 1.0))
