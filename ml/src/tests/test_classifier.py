from ..models.hazard_classifier import load_hazard_classifier
from ..config import Config
from ..nlp.preprocessing import prepare
from .fixtures import EN_TWEET, HI_TWEET, BN_TWEET

def test_basic_inference():
    cfg = Config()
    clf = load_hazard_classifier(cfg.HAZARD_MODEL_PATH, cfg.INDIC_MODEL_NAME)

    for txt in [EN_TWEET, HI_TWEET, BN_TWEET]:
        clean, lang = prepare(txt)
        probs = clf.predict(clean)
        assert isinstance(probs, dict)
        assert sum(probs.values()) > 0
