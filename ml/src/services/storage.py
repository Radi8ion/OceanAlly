# Placeholder to push results to backend REST/GraphQL if needed
import requests
import os

API_BASE = os.getenv("SERVER_API_BASE", "http://server:3000")

def post_analysis(report_id: str, payload: dict):
    try:
        requests.post(f"{API_BASE}/ml/analysis/{report_id}", json=payload, timeout=5)
    except Exception:
        pass
