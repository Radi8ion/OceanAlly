from dataclasses import dataclass
import os

@dataclass
class Config:
    # Kafka
    KAFKA_BROKERS: str = os.getenv("KAFKA_BROKERS", "localhost:9092")
    KAFKA_GROUP_ID: str = os.getenv("KAFKA_GROUP_ID", "ml-consumers")
    KAFKA_TOPIC_SOCIAL_IN: str = os.getenv("KAFKA_TOPIC_SOCIAL_IN", "social-media-stream")
    KAFKA_TOPIC_ANALYSIS_OUT: str = os.getenv("KAFKA_TOPIC_ANALYSIS_OUT", "analysis-results")

    # Models
    HAZARD_MODEL_PATH: str = os.getenv("HAZARD_MODEL_PATH", "models/hazard_classifier")
    INDIC_MODEL_NAME: str = os.getenv("INDIC_MODEL_NAME", "ai4bharat/indic-bert")
    BER_TOPIC_PATH: str = os.getenv("BER_TOPIC_PATH", "models/topic_model")

    # Service
    FLASK_HOST: str = os.getenv("FLASK_HOST", "0.0.0.0")
    FLASK_PORT: int = int(os.getenv("FLASK_PORT", "8000"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
