from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class ReportPayload(BaseModel):
    description: str
    hazard_type: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    language: Optional[str] = None
    media_urls: Optional[List[str]] = None
    timestamp: Optional[str] = None

class EnrichedReport(BaseModel):
    hazard_type: Optional[str]
    hazard_scores: Dict[str, float]
    sentiment: Dict[str, float]
    urgency: float
    language: str
    keywords: List[str]
