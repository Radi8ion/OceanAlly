from datetime import datetime
from ..schemas.report import ReportPayload, EnrichedReport
from ..nlp.preprocessing import prepare
from ..nlp.postprocessing import compute_urgency
from ..nlp.keywords import extract_keywords
from ..models.hazard_classifier import load_hazard_classifier
from ..models.sentiment import SentimentService
from ..config import Config

def enrich_report(report: ReportPayload) -> EnrichedReport:
    cfg = Config()
    clf = load_hazard_classifier(cfg.HAZARD_MODEL_PATH, cfg.INDIC_MODEL_NAME)
    sent = SentimentService()

    text, lang = prepare(report.description)
    hazard_scores = clf.predict(text)
    sentiment = sent.score(text)
    urgency = compute_urgency(hazard_scores, sentiment, engagement=None)
    return EnrichedReport(
        hazard_type=max(hazard_scores, key=hazard_scores.get),
        hazard_scores=hazard_scores,
        sentiment=sentiment,
        urgency=urgency,
        language=lang,
        keywords=extract_keywords(text),
    )
