import sys
from .logging_conf import setup_logging
from .config import Config
from .app import app
from .pipelines.social_stream_consumer import run_social_consumer

def serve():
    cfg = Config()
    setup_logging(cfg.LOG_LEVEL)
    app.run(host=cfg.FLASK_HOST, port=cfg.FLASK_PORT)

def consume_social():
    setup_logging()
    run_social_consumer()

def trends():
    # simple ad-hoc run for trends (expects JSON array via stdin)
    import json, sys
    from .pipelines.trend_detection import detect_trends
    posts = json.load(sys.stdin)
    print(detect_trends(posts).model_dump_json(indent=2))

if __name__ == "__main__":
    cmd = sys.argv[21] if len(sys.argv) > 1 else "serve"
    {"serve": serve, "consume-social": consume_social, "trends": trends}.get(cmd, serve)()
