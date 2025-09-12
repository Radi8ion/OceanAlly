from flask import Flask, jsonify, request
from .config import Config
from .logging_conf import setup_logging
from .pipelines.report_enrichment import enrich_report
from .pipelines.trend_detection import detect_trends
from .schemas.report import ReportPayload
from .schemas.social import SocialMediaPost

setup_logging()
app = Flask(__name__)
cfg = Config()

@app.get("/health")
def health():
    return jsonify({"status": "ok"}), 200

@app.post("/analyze_text")
def analyze_text():
    data = request.get_json(force=True) or {}
    payload = ReportPayload(**{
        "description": data.get("text", ""),
        "language": data.get("language"),
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
    })
    enriched = enrich_report(payload).model_dump()
    return jsonify(enriched), 200

@app.post("/analyze_social_post")
def analyze_social_post():
    data = request.get_json(force=True) or {}
    post = SocialMediaPost(**data)
    payload = ReportPayload(description=post.text, language=post.language)
    enriched = enrich_report(payload).model_dump()
    return jsonify({
        "platform": post.platform,
        "post_id": post.id,
        "analysis": enriched
    }), 200

@app.post("/detect_trends")
def detect_trends_endpoint():
    body = request.get_json(force=True) or {}
    posts = body.get("posts", [])
    result = detect_trends(posts).model_dump()
    return jsonify(result), 200
