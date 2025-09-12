from transformers import AutoTokenizer, AutoModelForSequenceClassification, TextClassificationPipeline
import os
from typing import Dict, List

HAZARD_LABELS = [
    "tsunami", "storm_surge", "high_waves", "coastal_current",
    "swell_surge", "flooding", "coastal_erosion", "other"
]

class HazardClassifier:
    def __init__(self, model_path: str | None = None, base_model_name: str = "ai4bharat/indic-bert"):
        model_path = model_path or base_model_name
        self.tokenizer = AutoTokenizer.from_pretrained(model_path, keep_accents=True)
        self.model = AutoModelForSequenceClassification.from_pretrained(
            model_path, num_labels=len(HAZARD_LABELS)
        )
        self.pipe = TextClassificationPipeline(
            model=self.model, tokenizer=self.tokenizer, top_k=None, return_all_scores=True
        )

    def predict(self, text: str) -> Dict[str, float]:
        scores = self.pipe(text)
        # Map to fixed label order if labels exist; else map by index
        label_scores: Dict[str, float] = {}
        for i, s in enumerate(scores):
            label = s.get("label", HAZARD_LABELS[i] if i < len(HAZARD_LABELS) else f"label_{i}")
            label_scores[label] = float(s["score"])
        # Normalize to HAZARD_LABELS space (fallback if label names differ)
        normalized = {lbl: label_scores.get(lbl, 0.0) for lbl in HAZARD_LABELS}
        return normalized

def load_hazard_classifier(model_dir: str | None, fallback_model: str):
    return HazardClassifier(model_dir if (model_dir and os.path.exists(model_dir)) else fallback_model)
