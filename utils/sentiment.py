from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import re

analyzer = SentimentIntensityAnalyzer()

# Hazard-specific keywords for urgency detection
URGENT_KEYWORDS = [
    'emergency', 'urgent', 'immediate', 'danger', 'critical', 'severe',
    'life-threatening', 'accident', 'injury', 'fire', 'flood', 'collapse'
]

def analyze_sentiment(text):
    """Get sentiment score using VADER"""
    if not text:
        return 0.0
    
    try:
        scores = analyzer.polarity_scores(text)
        return scores['compound']
    except Exception as e:
        print(f"Sentiment analysis error: {e}")
        return 0.0

def get_urgency_level(sentiment_score, classification=None):
    """
    Determine urgency level based on sentiment and classification
    Returns: 'low', 'medium', 'high', 'critical'
    """
    try:
        urgency_score = 0
        
        # Sentiment contribution
        if sentiment_score <= -0.5:
            urgency_score += 3  # Very negative = more urgent
        elif sentiment_score <= -0.1:
            urgency_score += 2
        elif sentiment_score >= 0.1:
            urgency_score -= 1  # Positive = less urgent
        
        # Classification contribution
        if classification == "2":  # highly_relevant
            urgency_score += 2
        elif classification == "1":  # relevant
            urgency_score += 1
        
        # Determine final urgency level
        if urgency_score >= 5:
            return "critical"
        elif urgency_score >= 3:
            return "high"
        elif urgency_score >= 1:
            return "medium"
        else:
            return "low"
            
    except Exception as e:
        print(f"Urgency calculation error: {e}")
        return "medium"

def check_urgent_keywords(text):
    """Check for urgent keywords in text"""
    if not text:
        return False
    
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in URGENT_KEYWORDS)