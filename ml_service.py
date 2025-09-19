import os
import re
import json
from datetime import datetime, timedelta, timezone

# --- Core Flask and Web Libraries ---
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from dotenv import load_dotenv

# --- Machine Learning & NLP Libraries ---
import torch
import spacy
from PIL import Image
from transformers import (
    AutoTokenizer, AutoModelForSequenceClassification,
    BlipProcessor, BlipForConditionalGeneration
)

# --- Utility Script Imports ---
from utils.classifier import classify_text
from utils.sentiment import analyze_sentiment, get_urgency_level
from utils.clustering import find_hotspots
from utils.chatbot import load_dataset, get_answer

# --- Third-party API Libraries ---
import praw
from gnews import GNews

# --- Load Environment Variables ---
load_dotenv()

# --- Flask Setup ---
app = Flask(__name__)
CORS(app)

# --- API CONFIGURATION ---
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT")
GNEWS_API_KEY = os.getenv("GNEWS_API_KEY")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

# --- YOUTUBE CONSTANTS ---
YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_QUERY = "flood OR cyclone OR storm OR coastal OR erosion OR tsunami OR sea-level"
MAX_RESULTS = 15

# --- CACHE SETUP ---
social_media_cache = {
    'reddit': {'data': [], 'last_fetch': None, 'cache_duration': 600},
    'gnews': {'data': [], 'last_fetch': None, 'cache_duration': 1800},
    'youtube': {'data': [], 'last_fetch': None, 'cache_duration': 1800}
}

# --- Chatbot Dataset ---
try:
    chatbot_dataset = load_dataset()
    print("Chatbot dataset loaded successfully")
except Exception as e:
    print(f"Error loading chatbot dataset: {e}")
    chatbot_dataset = None

# --- ML MODEL SETUP ---
MODEL_PATH = 'models/indicbert/'
BLIP_MODEL_PATH = 'models/blip2/'
RELEVANCE_THRESHOLD = 0.3

try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
    print("✅ IndicBERT model and tokenizer loaded successfully")
except Exception as e:
    print(f"❌ Error loading IndicBERT model: {e}")
    tokenizer = None
    model = None

try:
    blip_processor = BlipProcessor.from_pretrained(BLIP_MODEL_PATH)
    blip_model = BlipForConditionalGeneration.from_pretrained(BLIP_MODEL_PATH)
    print("✅ BLIP image captioning model loaded successfully.")
except Exception as e:
    print(f"❌ Error loading BLIP model: {e}")
    blip_processor = None
    blip_model = None

# --- Indian Locations Dataset ---
# --- Indian Locations Dataset (FIXED) ---
try:
    with open("indian_locations.json", "r", encoding="utf-8") as f:
        locations_data = json.load(f)

    all_locations = set()

    # Handle the nested structure properly
    for category, locations in locations_data.items():
        if isinstance(locations, list):
            for loc in locations:
                if isinstance(loc, str):
                    all_locations.add(loc.lower())
        elif isinstance(locations, str):
            all_locations.add(locations.lower())
        elif isinstance(locations, dict):
            # Handle nested dictionaries if any
            for sub_category, sub_locations in locations.items():
                if isinstance(sub_locations, list):
                    for loc in sub_locations:
                        if isinstance(loc, str):
                            all_locations.add(loc.lower())
                elif isinstance(sub_locations, str):
                    all_locations.add(sub_locations.lower())

    print(f"✅ Loaded {len(all_locations)} Indian locations successfully")
    
    # Debug: Print first 10 locations to verify
    print(f"🔍 Sample locations: {list(all_locations)[:10]}")

except Exception as e:
    print(f"❌ Error loading Indian locations: {e}")
    all_locations = set()



# --- NER Setup ---
try:
    nlp = spacy.load("en_core_web_sm")
    print("✅ Spacy model loaded successfully")
except Exception as e:
    print(f"❌ Error loading Spacy model: {e}")
    nlp = None

# --- HELPER FUNCTIONS ---
def is_social_cache_valid(platform):
    cache = social_media_cache.get(platform, {})
    if not cache.get('last_fetch'):
        return False
    elapsed = (datetime.now(timezone.utc) - cache['last_fetch']).total_seconds()
    return elapsed < cache.get('cache_duration', 300)

def is_relevant_ml(text):
    """Check relevance using ML model"""
    if not all([text, tokenizer, model]) or len(text.strip()) < 10:
        return False
    try:
        inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)
        with torch.no_grad():
            outputs = model(**inputs)
        scores = torch.softmax(outputs.logits, dim=1)
        return scores[0][1].item() >= RELEVANCE_THRESHOLD
    except Exception as e:
        print(f"Relevance check error: {e}")
        return False

def is_relevant(text):
    """Alias for is_relevant_ml for backward compatibility"""
    return is_relevant_ml(text)

def check_text_relevance_keywords(text):
    keywords = [
        'flood', 'cyclone', 'storm', 'tsunami', 'erosion', 'sea level', 'coastal',
        'hurricane', 'disaster', 'weather', 'climate', 'rain', 'monsoon', 'landslide',
        'evacuation', 'alert', 'warning', 'typhoon', 'drought', 'flooding'
    ]
    return any(keyword in text.lower() for keyword in keywords)
    
def check_text_relevance(text):
    """Alias for check_text_relevance_keywords for backward compatibility"""
    return check_text_relevance_keywords(text)

from difflib import get_close_matches

def get_indian_locations(text):
    if not nlp or not text:
        return []
    
    doc = nlp(text)
    entities = [ent.text for ent in doc.ents if ent.label_ in ("GPE", "LOC")]
    
    indian_locations = []
    for loc in entities:
        loc_lower = loc.lower()
        
        # exact match
        if loc_lower in all_locations:
            indian_locations.append(loc)
        else:
            # fuzzy match (e.g., "Bombay" → "Mumbai")
            match = get_close_matches(loc_lower, all_locations, n=1, cutoff=0.8)
            if match:
                indian_locations.append(match[0])
    
    return indian_locations

# --- SOCIAL MEDIA FEED ROUTE ---
@app.route("/live-feeds", methods=["GET"])
def live_feeds():
    feeds = {}

    # --- Get Reddit data ---
    reddit_data = {}
    try:
        if is_social_cache_valid('reddit'):
            reddit_data = {"status": "success", "posts": social_media_cache['reddit']['data'], "cached": True}
        else:
            if not all([REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT]):
                reddit_data = {"status": "error", "message": "Reddit API credentials not configured", "posts": []}
            else:
                reddit = praw.Reddit(
                    client_id=REDDIT_CLIENT_ID,
                    client_secret=REDDIT_CLIENT_SECRET,
                    user_agent=REDDIT_USER_AGENT
                )
                subreddits = reddit.subreddit("india+worldnews+news+IndiaSpeaks+IndiaNews+climate+environment")
                hot_posts = subreddits.hot(limit=50)
                
                relevant_posts = []
                for post in hot_posts:
                    if not post.stickied:
                        title = post.title or ""
                        selftext = post.selftext or ""
                        full_text = f"{title} {selftext}"
                        
                        indian_locations = get_indian_locations(full_text)
                        ml_relevant = is_relevant_ml(full_text)
                        keyword_relevant = check_text_relevance_keywords(full_text)
                        
                        ## FIX: Combined the logic into a single condition with AND.
                        # A post is included only if it's relevant AND has an Indian connection.
                        # An Indian connection is an Indian location OR being in an India-specific subreddit.
                        is_post_relevant = ml_relevant or keyword_relevant
                        has_indian_connection = indian_locations or any(sub in post.subreddit.display_name.lower() for sub in ['india', 'indiaspeaks'])

                        if is_post_relevant and has_indian_connection:
                            relevant_posts.append({
                                "id": post.id, 
                                "title": title, 
                                "selftext": selftext,
                                "created_utc": post.created_utc, 
                                "author": post.author.name if post.author else "Deleted",
                                "score": post.score, 
                                "num_comments": post.num_comments, 
                                "url": post.url,
                                "subreddit": post.subreddit.display_name, 
                                "thumbnail": post.thumbnail if post.thumbnail != 'self' else None,
                                "locations": indian_locations
                            })
                
                relevant_posts = sorted(relevant_posts, key=lambda x: x['score'], reverse=True)[:25]
                
                social_media_cache['reddit'].update({'data': relevant_posts, 'last_fetch': datetime.now(timezone.utc)})
                reddit_data = {"status": "success", "posts": relevant_posts, "cached": False}

    except Exception as e:
        reddit_data = {"status": "error", "message": f"Error fetching Reddit posts: {str(e)}", "posts": []}

    feeds["reddit"] = {
        "status": reddit_data.get("status", "error"), 
        "data": reddit_data.get("posts", []),
        "count": len(reddit_data.get("posts", [])), 
        "message": reddit_data.get("message")
    }

    ## FIX: Added the missing GNews implementation.
    # --- Get GNews data ---
    gnews_data = {}
    try:
        if is_social_cache_valid('gnews'):
            gnews_data = {"status": "success", "articles": social_media_cache['gnews']['data'], "cached": True}
        else:
            if not GNEWS_API_KEY or "YOUR_GNEWS" in str(GNEWS_API_KEY):
                 gnews_data = {"status": "error", "message": "GNews API key not configured", "articles": []}
            else:
                query = "cyclone OR tsunami OR flood OR earthquake OR landslide"
                url = f"https://gnews.io/api/v4/search?q={query}&lang=en&country=in&max=25&apikey={GNEWS_API_KEY}"
                response = requests.get(url, timeout=10)
                articles = []
                if response.status_code == 200:
                    for article in response.json().get("articles", []):
                        full_text = f"{article.get('title', '')} {article.get('description', '')} {article.get('content', '')}"
                        ml_relevant = is_relevant_ml(full_text)
                        keyword_relevant = check_text_relevance_keywords(full_text)
                        
                        if ml_relevant or keyword_relevant:
                             articles.append({
                                "title": article.get("title"),
                                "description": article.get("description"),
                                "url": article.get("url"),
                                "image": article.get("image"),
                                "publishedAt": article.get("publishedAt"),
                                "source": article.get("source", {}).get("name"),
                                "locations": get_indian_locations(full_text)
                            })
                    social_media_cache['gnews'].update({'data': articles, 'last_fetch': datetime.now(timezone.utc)})
                    gnews_data = {"status": "success", "articles": articles, "cached": False}
                else:
                    gnews_data = {"status": "error", "message": f"GNews API error: {response.status_code}", "articles": []}

    except Exception as e:
        gnews_data = {"status": "error", "message": f"Error fetching GNews articles: {str(e)}", "articles": []}

    feeds["gnews"] = {
        "status": gnews_data.get("status", "error"), 
        "data": gnews_data.get("articles", []),
        "count": len(gnews_data.get("articles", [])), 
        "message": gnews_data.get("message")
    }
    
    # --- Get YouTube data ---
    youtube_data = {}
    try:
        if is_social_cache_valid('youtube'):
            youtube_data = {"status": "success", "videos": social_media_cache['youtube']['data'], "cached": True}
        else:
            if not YOUTUBE_API_KEY or "YOUR_YOUTUBE" in str(YOUTUBE_API_KEY):
                youtube_data = {"status": "error", "message": "YouTube API key not configured", "videos": []}
            else:
                three_months_ago = datetime.utcnow() - timedelta(days=90)
                published_after = three_months_ago.isoformat("T") + "Z"
                
                params = {
                    "part": "snippet", 
                    "q": YOUTUBE_QUERY, # e.g., "tsunami OR flood OR cyclone india"
                    "type": "video", 
                    "publishedAfter": published_after, 
                    "maxResults": MAX_RESULTS,
                    "regionCode": "IN", 
                    "key": YOUTUBE_API_KEY
                }
                response = requests.get(YOUTUBE_SEARCH_URL, params=params, timeout=10)
                
                if response.status_code == 200:
                    videos = []
                    video_ids = [item['id']['videoId'] for item in response.json().get('items', [])]
                    
                    if video_ids:
                        details_params = {
                            "part": "snippet,statistics", 
                            "id": ",".join(video_ids),
                            "key": YOUTUBE_API_KEY
                        }
                        details_response = requests.get("https://www.googleapis.com/youtube/v3/videos", 
                                                      params=details_params, timeout=10)
                        
                        if details_response.status_code == 200:
                            for item in details_response.json().get("items", []):
                                snippet = item.get("snippet", {})
                                stats = item.get("statistics", {})
                                title = snippet.get("title", "")
                                description = snippet.get("description", "")
                                full_text = f"{title}. {description}"
                                
                                indian_locations = get_indian_locations(full_text)
                                ml_relevant = is_relevant_ml(full_text)
                                keyword_relevant = check_text_relevance_keywords(full_text)
                                
                                ## FIX: Removed the permissive 'elif' clause.
                                # A video is now included ONLY if it's relevant AND mentions an Indian location.
                                is_video_relevant = ml_relevant or keyword_relevant

                                if is_video_relevant and indian_locations:
                                    videos.append({
                                        "videoId": item.get("id"), 
                                        "title": title,
                                        "description": description, 
                                        "publishedAt": snippet.get("publishedAt"),
                                        "thumbnail": snippet.get("thumbnails", {}).get("medium", {}).get("url"),
                                        "location": indian_locations,
                                        "channelTitle": snippet.get("channelTitle"),
                                        "viewCount": stats.get("viewCount"), 
                                        "likeCount": stats.get("likeCount"),
                                        "commentCount": stats.get("commentCount")
                                    })
                    
                    social_media_cache['youtube'].update({'data': videos, 'last_fetch': datetime.now(timezone.utc)})
                    youtube_data = {"status": "success", "videos": videos, "cached": False}
                else:
                    youtube_data = {"status": "error", "message": f"YouTube API error: {response.status_code}", "videos": []}
    except Exception as e:
        youtube_data = {"status": "error", "message": f"Error fetching YouTube videos: {str(e)}", "videos": []}

    feeds["youtube"] = {
        "status": youtube_data.get("status", "error"), 
        "data": youtube_data.get("videos", []),
        "count": len(youtube_data.get("videos", [])), 
        "message": youtube_data.get("message")
    }

    return jsonify({
        "status": "success",
        "feeds": feeds,
        "last_updated": datetime.now(timezone.utc).isoformat()
    })
# --- AI PROCESSING ROUTES ---
@app.route("/analyze_image", methods=["POST"])
def analyze_image():
    """Analyze uploaded image using BLIP and IndicBERT models"""
    if not blip_model or not model:
        return jsonify({
            "status": "error",
            "message": "AI models are not available. Please check server logs."
        }), 503

    if 'image' not in request.files:
        return jsonify({
            "status": "error", 
            "message": "No image file provided"
        }), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({
            "status": "error", 
            "message": "No image file selected"
        }), 400

    try:
        # 1. Generate caption with BLIP
        raw_image = Image.open(file.stream).convert("RGB")
        inputs = blip_processor(raw_image, return_tensors="pt")
        out = blip_model.generate(**inputs, max_new_tokens=50)
        caption = blip_processor.decode(out[0], skip_special_tokens=True)

        # 2. Analyze caption with IndicBERT (using your existing functions)
        classification_label, confidence = classify_text(caption)
        sentiment_score = analyze_sentiment(caption)
        urgency_level = get_urgency_level(sentiment_score, classification_label)

        # 3. Send the complete analysis back to the frontend
        response_data = {
            "status": "success",
            "caption": caption,
            "classification": {
                "label": classification_label,
                "confidence": confidence,
                "labels_map": {
                    '0': 'Not Relevant',
                    '1': 'Relevant',
                    '2': 'Highly Relevant'
                }
            },
            "sentiment": {
                "score": sentiment_score,
                "urgency_level": urgency_level
            }
        }
        return jsonify(response_data)

    except Exception as e:
        print(f"Error during image analysis: {e}")
        return jsonify({
            "status": "error", 
            "message": "Failed to analyze image"
        }), 500

@app.route('/process-text', methods=['POST'])
def process_text():
    """Process text for classification and sentiment analysis"""
    try:
        data = request.json
        if not data or 'description' not in data:
            return jsonify({'error': 'Description required'}), 400
       
        text = data['description']
        classification, confidence = classify_text(text)
        sentiment = analyze_sentiment(text)
        urgency = get_urgency_level(sentiment, classification)
       
        return jsonify({
            'classification': {'label': classification, 'confidence': confidence},
            'sentiment': {'score': sentiment, 'urgency_level': urgency}
        })
    except Exception as e:
        return jsonify({'error': f'Processing failed: {str(e)}'}), 500

@app.route('/find-hotspots', methods=['POST'])
def find_hotspots_route():
    """Find hotspots from disaster reports"""
    try:
        data = request.json
        if not data or 'reports' not in data or len(data['reports']) < 3:
            return jsonify({
                'hotspots': [], 
                'message': 'Insufficient data (minimum 3 reports required)'
            }), 400
       
        reports = data['reports']
        hotspots = find_hotspots(reports)
        return jsonify({'hotspots': hotspots})
    except Exception as e:
        return jsonify({'error': f'Hotspot analysis failed: {str(e)}'}), 500

@app.route('/chat', methods=['POST'])
def chat_route():
    """Chatbot endpoint"""
    if not chatbot_dataset:
        return jsonify({'error': 'Chatbot not available'}), 503
   
    try:
        data = request.json
        if not data or 'message' not in data:
            return jsonify({'error': 'Message required'}), 400
       
        user_input = data['message']
        response = get_answer(chatbot_dataset, user_input)
        return jsonify({'response': response})
    except Exception as e:
        return jsonify({'error': f'Chat processing failed: {str(e)}'}), 500

# --- UTILITY ROUTES ---
@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'chatbot_loaded': chatbot_dataset is not None,
        'indicbert_loaded': tokenizer is not None and model is not None,
        'blip_loaded': blip_processor is not None and blip_model is not None,
        'spacy_loaded': nlp is not None,
        'locations_loaded': len(all_locations) > 0,
        'youtube_configured': bool(YOUTUBE_API_KEY and YOUTUBE_API_KEY != "YOUR_YOUTUBE_API_KEY"),
        'reddit_configured': bool(REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET),
        'gnews_configured': bool(GNEWS_API_KEY)
    })

@app.route('/cache-status', methods=['GET'])
def cache_status():
    """Get cache status for all platforms"""
    cache_info = {}
    
    for platform in social_media_cache:
        cache = social_media_cache[platform]
        cache_info[platform] = {
            'cached_count': len(cache['data']),
            'last_fetch': cache['last_fetch'].isoformat() if cache['last_fetch'] else None,
            'is_valid': is_social_cache_valid(platform),
            'cache_duration': cache['cache_duration']
        }
    
    return jsonify(cache_info)

@app.route('/clear-cache', methods=['POST'])
def clear_cache():
    """Clear all caches"""
    # Clear social media caches
    for platform in social_media_cache:
        social_media_cache[platform]['data'] = []
        social_media_cache[platform]['last_fetch'] = None
    
    return jsonify({
        'status': 'success', 
        'message': 'All caches cleared'
    })

@app.route('/clear-cache/<platform>', methods=['POST'])
def clear_platform_cache(platform):
    """Clear cache for specific platform"""    
    if platform in social_media_cache:
        social_media_cache[platform]['data'] = []
        social_media_cache[platform]['last_fetch'] = None
        return jsonify({
            'status': 'success', 
            'message': f'{platform.capitalize()} cache cleared'
        })
    
    return jsonify({
        'status': 'error', 
        'message': f'Platform {platform} not found'
    }), 404

# --- API DOCUMENTATION ROUTE ---
@app.route('/api-docs', methods=['GET'])
def api_docs():
    """API documentation endpoint"""
    docs = {
        "social_media_endpoints": {
            "/live-feeds": "GET - Get all social media feeds in one response",
            "/recent-videos": "GET - Original YouTube endpoint with debug options"
        },
        "ai_processing_endpoints": {
            "/analyze_image": "POST - Analyze uploaded image using BLIP + IndicBERT",
            "/process-text": "POST - Process text for classification and sentiment",
            "/find-hotspots": "POST - Find disaster hotspots from reports",
            "/chat": "POST - Chatbot interaction endpoint"
        },
        "utility_endpoints": {
            "/health": "GET - System health check",
            "/cache-status": "GET - View cache status for all platforms",
            "/clear-cache": "POST - Clear all caches",
            "/clear-cache/<platform>": "POST - Clear cache for specific platform",
            "/api-docs": "GET - This documentation"
        },
        "required_env_variables": {
            "REDDIT_CLIENT_ID": "Reddit API client ID",
            "REDDIT_CLIENT_SECRET": "Reddit API client secret",
            "REDDIT_USER_AGENT": "Reddit API user agent",
            "GNEWS_API_KEY": "Google News API key",
            "YOUTUBE_API_KEY": "YouTube Data API v3 key"
        }
    }
    return jsonify(docs)

# --- ERROR HANDLERS ---
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'status': 'error',
        'message': 'Endpoint not found',
        'available_endpoints': '/api-docs'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'status': 'error',
        'message': 'Internal server error',
        'details': str(error)
    }), 500

@app.errorhandler(429)
def rate_limit_error(error):
    return jsonify({
        'status': 'error',
        'message': 'Rate limit exceeded',
        'retry_after': '60 seconds'
    }), 429

# --- DEVELOPMENT ROUTES (only in debug mode) ---
@app.route('/debug/test-models', methods=['GET'])
def test_models():
    """Test all loaded models (debug only)"""
    if not app.debug:
        return jsonify({'error': 'Debug mode only'}), 403
    
    results = {
        'indicbert': {
            'loaded': tokenizer is not None and model is not None,
            'test_text': 'Flood warning in coastal areas'
        },
        'blip': {
            'loaded': blip_processor is not None and blip_model is not None,
            'status': 'Image captioning model ready'
        },
        'spacy': {
            'loaded': nlp is not None,
            'test_entities': []
        }
    }
    
    # Test IndicBERT
    if results['indicbert']['loaded']:
        try:
            test_text = results['indicbert']['test_text']
            classification, confidence = classify_text(test_text)
            results['indicbert']['classification'] = classification
            results['indicbert']['confidence'] = confidence
        except Exception as e:
            results['indicbert']['error'] = str(e)
    
    # Test Spacy NER
    if results['spacy']['loaded']:
        try:
            doc = nlp("Mumbai and Chennai are experiencing heavy rainfall.")
            results['spacy']['test_entities'] = [(ent.text, ent.label_) for ent in doc.ents]
        except Exception as e:
            results['spacy']['error'] = str(e)
    
    return jsonify(results)

# --- Run the Server ---
if __name__ == '__main__':
    print("🚀 Starting Disaster Management Flask Server...")
    print(f"📊 Models loaded: IndicBERT={model is not None}, BLIP={blip_model is not None}, Spacy={nlp is not None}")
    print(f"🔧 APIs configured: Reddit={bool(REDDIT_CLIENT_ID)}, reddit={bool(REDDIT_CLIENT_SECRET)},  YouTube={bool(YOUTUBE_API_KEY)}")
    print(f"📍 Indian locations loaded: {len(all_locations)}")
    print("🌐 Server running on http://localhost:5001")
    print("📖 API Documentation: http://localhost:5001/api-docs")
    
    app.run(port=5001, debug=True)