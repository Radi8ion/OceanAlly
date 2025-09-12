from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class SocialMediaPost(BaseModel):
    platform: str
    id: str
    text: str
    created_at: str
    language: Optional[str] = None
    geo: Optional[Dict[str, Any]] = None
    engagement: Optional[Dict[str, Any]] = None
    context: Optional[Dict[str, Any]] = None
