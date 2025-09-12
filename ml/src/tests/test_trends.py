from ..pipelines.trend_detection import detect_trends
from .fixtures import EN_TWEET, HI_TWEET, BN_TWEET

def test_trend_detection_runs():
    res = detect_trends([EN_TWEET, HI_TWEET, BN_TWEET])
    assert res.total_posts_analyzed >= 1
    assert isinstance(res.trending_hazards, list)
