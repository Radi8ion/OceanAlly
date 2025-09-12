import os
import logging
from datetime import datetime
from ..schemas.social import SocialMediaPost
from ..schemas.analysis import HazardAnalysis
from ..services.kafka_client import KafkaClient
from ..nlp.preprocessing import prepare
from ..nlp.postprocessing import compute_urgency
from ..nlp.keywords import extract_keywords
from ..models.hazard_classifier import load_hazard_classifier
from ..models.sentiment import SentimentService
from ..config import Config

log = logging.getLogger("social-consumer")

def run_social_consumer():
    cfg = Config()
    kc = KafkaClient(cfg.KAFKA_BROKERS)
    consumer = kc.consumer(cfg.KAFKA_TOPIC_SOCIAL_IN, cfg.KAFKA_GROUP_ID)
    producer = kc.producer()

    clf = load_hazard_classifier(cfg.HAZARD_MODEL_PATH, cfg.INDIC_MODEL_NAME)
    sent = SentimentService()

    log.info("Starting social media consumer...")
    for raw in kc.iter_messages(consumer):
        try:
            post = SocialMediaPost(**raw)
            text, lang = prepare(post.text)

            hazard_scores = clf.predict(text)
            sentiment = sent.score(text)
            urgency = compute_urgency(hazard_scores, sentiment, post.engagement or {})

            result = HazardAnalysis(
                hazard_type=max(hazard_scores, key=hazard_scores.get),
                hazard_scores=hazard_scores,
                sentiment=sentiment,
                urgency=urgency,
                keywords=extract_keywords(text),
                language=lang
            ).model_dump()

            out = {
                "source": "social",
                "platform": post.platform,
                "post_id": post.id,
                "created_at": post.created_at,
                "analysis": result,
                "timestamp": datetime.utcnow().isoformat()
            }
            producer.send(os.getenv("KAFKA_TOPIC_ANALYSIS_OUT", "analysis-results"), out)
            log.info("Analyzed post %s (%s)", post.id, post.platform)
        except Exception as e:
            log.exception("Failed to process message: %s", e)
