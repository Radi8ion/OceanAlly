from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import torch
from datetime import datetime, timedelta
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import spacy
import json
import re
# --- Utility Script Imports ---
from utils.classifier import classify_text
from utils.sentiment import analyze_sentiment, get_urgency_level
from utils.clustering import find_hotspots
from utils.chatbot import load_dataset, get_answer

# --- Cache and Rate Limiting ---
tweet_cache = {
    'data': [],
    'last_fetch': None,
    'cache_duration_seconds': 300  # 5 minutes cache
}

rate_limit_tracker = {
    'last_request_time': None,
    'cooldown_seconds': 60  # 1 minute cooldown
}

# --- Flask Setup ---
app = Flask(__name__)
CORS(app)

# --- Chatbot Dataset ---
try:
    chatbot_dataset = load_dataset()
    print("Chatbot dataset loaded successfully")
except Exception as e:
    print(f"Error loading chatbot dataset: {e}")
    chatbot_dataset = None

# --- Twitter API Configuration ---
TWITTER_BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAAMab4AEAAAAAcylID%2F%2BKVCqDNVt73QSEy9b8IC8%3DBrZzqnyJyjvoRIpdM0Ifdmoh0YpHeCqqeS8XSnYJOIQWKKmCTK'  # Replace or use environment variables
TWITTER_SEARCH_URL = 'https://api.twitter.com/2/tweets/search/recent'
HEADERS = {
    'Authorization': f'Bearer {TWITTER_BEARER_TOKEN}'
} if TWITTER_BEARER_TOKEN else {}

# --- YouTube API Configuration ---
YOUTUBE_API_KEY = "AIzaSyC8aIJTmSKJpQYyaKqxYFNHP96beJy1-y8"  # Replace with your actual API key
YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_QUERY = "flood OR cyclone OR storm OR coastal OR erosion OR tsunami OR sea-level"
MAX_RESULTS = 15

# --- ML Model Setup ---
MODEL_PATH = 'models/indicbert/'
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
    print("Model and tokenizer loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")
    tokenizer = None
    model = None

RELEVANCE_THRESHOLD = 0.3  # Lowered from 0.5

# --- Indian Locations Dataset with Aliases ---
try:
    with open("indian_locations.json", "r", encoding="utf-8") as f:
        locations_data = json.load(f)
    
    # Create normalized location sets for better matching
    all_locations = set()
    location_aliases = {
        'mumbai': ['bombay'],
        'chennai': ['madras'], 
        'kolkata': ['calcutta'],
        'bangalore': ['bengaluru'],
        'mysore': ['mysuru'],
        'varanasi': ['benares'],
        'allahabad': ['prayagraj'],
        'gurgaon': ['gurugram'],
        'visakhapatnam': ['vizag', 'vishakhapatnam'],
        'tiruchirappalli': ['trichy'],
        'kochi': ['cochin'],
        'puducherry': ['pondicherry'],
        'odisha': ['orissa'],
        'tamil nadu': ['tn'],
        'andhra pradesh': ['ap'],
        'west bengal': ['wb'],
        'uttar pradesh': ['up'],
        'madhya pradesh': ['mp'],
        'himachal pradesh': ['hp']
    }
    
    for loc_list in [locations_data['states'], locations_data['union_territories'], locations_data['coastal_cities']]:
        for loc in loc_list:
            normalized = loc.lower().strip()
            all_locations.add(normalized)
            # Add aliases if they exist
            if normalized in location_aliases:
                for alias in location_aliases[normalized]:
                    all_locations.add(alias)
    
    print(f"Loaded {len(all_locations)} Indian locations (including aliases)")
except Exception as e:
    print(f"Error loading Indian locations: {e}")
    all_locations = set()
    locations_data = {'states': [], 'union_territories': [], 'coastal_cities': []}

# --- NER Setup ---
try:
    nlp = spacy.load("en_core_web_sm")
    print("Spacy model loaded successfully")
except Exception as e:
    print(f"Error loading Spacy model: {e}")
    nlp = None

# --- Helper Functions ---
def is_cache_valid():
    if not tweet_cache['last_fetch']:
        return False
    elapsed = (datetime.utcnow() - tweet_cache['last_fetch']).total_seconds()
    return elapsed < tweet_cache['cache_duration_seconds']

def is_relevant(text):
    """Check relevance using ML model"""
    try:
        if not text or len(text.strip()) < 10 or not tokenizer or not model:
            return False
        
        inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)
        with torch.no_grad():
            outputs = model(**inputs)
        scores = torch.softmax(outputs.logits, dim=1)
        relevance_score = scores[0][1].item()  # class 1 = relevant
        return relevance_score >= RELEVANCE_THRESHOLD
    except Exception as e:
        print(f"Relevance check error: {e}")
        return False

def extract_locations(text):
    """Extract locations using NER and regex patterns"""
    try:
        if not text:
            return []
        
        locations = []
        
        # Use spaCy NER if available
        if nlp:
            doc = nlp(text)
            locations = [ent.text.strip() for ent in doc.ents if ent.label_ in ("GPE", "LOC")]
        
        # Also try regex pattern matching for common Indian location patterns
        indian_patterns = r'\b(Kerala|Tamil Nadu|Karnataka|Goa|Mumbai|Delhi|Chennai|Kolkata|Bangalore|Hyderabad|Ahmedabad|Pune|Surat|Jaipur|Lucknow|Kanpur|Nagpur|Indore|Thane|Bhopal|Visakhapatnam|Pimpri|Patna|Vadodara|Ghaziabad|Ludhiana|Agra|Nashik|Faridabad|Meerut|Rajkot|Kalyan|Vasai|Varanasi|Srinagar|Aurangabad|Dhanbad|Amritsar|Navi Mumbai|Allahabad|Ranchi|Howrah|Coimbatore|Jabalpur|Gwalior|Vijayawada|Jodhpur|Madurai|Raipur|Kota|Guwahati|Chandigarh|Solapur|Hubballi|Tiruchirappalli|Bareilly|Mysore|Tiruppur|Gurgaon|Aligarh|Jalandhar|Bhubaneswar|Salem|Warangal|Guntur|Bhiwandi|Saharanpur|Gorakhpur|Bikaner|Amravati|Noida|Jamshedpur|Bhilai|Cuttack|Firozabad|Kochi|Nellore|Bhavnagar|Dehradun|Durgapur|Asansol|Rourkela|Nanded|Kolhapur|Ajmer|Akola|Gulbarga|Jamnagar|Ujjain|Loni|Siliguri|Jhansi|Ulhasnagar|Jammu|Sangli|Mangalore|Erode|Belgaum|Ambattur|Tirunelveli|Malegaon|Gaya|Jalgaon|Udaipur|Maheshtala)\b'
        regex_matches = re.findall(indian_patterns, text, re.IGNORECASE)
        
        # Combine both approaches
        all_found = locations + regex_matches
        return list(set(all_found))  # Remove duplicates
    except Exception as e:
        print(f"Location extraction error: {e}")
        return []

def get_indian_locations(text):
    """Filter locations to only include Indian ones"""
    try:
        locations = extract_locations(text)
        indian_locs = []
        for loc in locations:
            loc_normalized = loc.lower().strip()
            if loc_normalized in all_locations:
                indian_locs.append(loc.strip())
        return indian_locs
    except Exception as e:
        print(f"Indian location filtering error: {e}")
        return []

def check_text_relevance(text):
    """Check if text contains disaster/climate related keywords"""
    climate_keywords = [
        'flood', 'flooding', 'cyclone', 'storm', 'tsunami', 'erosion', 
        'sea level', 'coastal', 'hurricane', 'typhoon', 'disaster', 
        'weather', 'climate', 'rain', 'monsoon', 'drought', 'landslide'
    ]
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in climate_keywords)

# --- YouTube Route (Updated) ---
@app.route("/recent-videos", methods=["GET"])
def recent_videos():
    """Fetch recent disaster-related videos from YouTube"""
    debug = request.args.get('debug', 'false').lower() == 'true'
    strict_mode = request.args.get('strict', 'true').lower() == 'true'

    # Check if YouTube API key is configured
    if not YOUTUBE_API_KEY or YOUTUBE_API_KEY == "YOUR_YOUTUBE_API_KEY":
        return jsonify({
            "status": "error", 
            "message": "YouTube API key not configured"
        }), 500

    try:
        # Set date range (last 30 days)
        one_month_ago = datetime.utcnow() - timedelta(days=30)
        published_after = one_month_ago.isoformat("T") + "Z"

        # YouTube API parameters
        params = {
            "part": "snippet",
            "q": YOUTUBE_QUERY,
            "type": "video",
            "publishedAfter": published_after,
            "maxResults": MAX_RESULTS,
            "regionCode": "IN",
            "key": YOUTUBE_API_KEY
        }

        # Make API request
        response = requests.get(YOUTUBE_SEARCH_URL, params=params, timeout=10)
        
        if response.status_code != 200:
            return jsonify({
                "status": "error", 
                "message": "YouTube API error", 
                "detail": response.text
            }), response.status_code

        data = response.json()
        filtered_videos = []
        debug_info = []

        # Process each video
        for item in data.get("items", []):
            snippet = item.get("snippet", {})
            title = snippet.get("title", "")
            description = snippet.get("description", "")
            
            # Combine title and description for better analysis
            full_text = f"{title}. {description}"
            
            # Extract locations from full text
            indian_locations = get_indian_locations(full_text)
            
            # Check relevance using multiple methods
            ml_relevant = is_relevant(description) if description else False
            keyword_relevant = check_text_relevance(full_text)
            
            # Decision logic
            include_video = False
            reason = ""
            
            if strict_mode:
                # Strict mode: both ML relevant AND has locations
                if ml_relevant and indian_locations:
                    include_video = True
                    reason = "ML relevant + locations found"
            else:
                # Relaxed mode: ML relevant OR (keyword relevant AND has locations)
                if ml_relevant or (keyword_relevant and indian_locations):
                    include_video = True
                    reason = f"ML: {ml_relevant}, Keywords: {keyword_relevant}, Locations: {bool(indian_locations)}"
            
            # Store debug info if requested
            if debug:
                debug_info.append({
                    "title": title,
                    "description": description[:200] + "..." if len(description) > 200 else description,
                    "ml_relevant": ml_relevant,
                    "keyword_relevant": keyword_relevant,
                    "locations_found": indian_locations,
                    "included": include_video,
                    "reason": reason
                })
            
            # Add to filtered results if it passes criteria
            if include_video:
                video_data = {
                    "title": title,
                    "description": description,
                    "location": indian_locations,
                    "videoId": item.get("id", {}).get("videoId", ""),
                    "publishedAt": snippet.get("publishedAt", "")
                }
                
                # Add thumbnail if available
                thumbnails = snippet.get("thumbnails", {})
                if "medium" in thumbnails:
                    video_data["thumbnail"] = thumbnails["medium"]["url"]
                elif "default" in thumbnails:
                    video_data["thumbnail"] = thumbnails["default"]["url"]
                
                filtered_videos.append(video_data)


        # Prepare response
        result = {
            "status": "success",
            "videos": filtered_videos,
            "total_found": len(filtered_videos)
        }
        
        if debug:
            result["debug_info"] = debug_info
            result["total_processed"] = len(debug_info)
            result["api_response_items"] = len(data.get("items", []))
        
        return jsonify(result)

    except requests.exceptions.Timeout:
        return jsonify({
            "status": "error", 
            "message": "YouTube API timeout"
        }), 408
    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": f"Error fetching videos: {str(e)}"
        }), 500

# --- Other Routes ---
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'chatbot_loaded': chatbot_dataset is not None,
        'model_loaded': tokenizer is not None and model is not None,
        'twitter_configured': bool(TWITTER_BEARER_TOKEN),
        'youtube_configured': bool(YOUTUBE_API_KEY and YOUTUBE_API_KEY != "YOUR_YOUTUBE_API_KEY"),
        'spacy_loaded': nlp is not None,
        'locations_loaded': len(all_locations) > 0
    })

@app.route('/cache-status', methods=['GET'])
def cache_status():
    return jsonify({
        'cached_tweets_count': len(tweet_cache['data']),
        'last_fetch': tweet_cache['last_fetch'].isoformat() if tweet_cache['last_fetch'] else None,
        'is_cache_valid': is_cache_valid()
    })

@app.route('/clear-cache', methods=['POST'])
def clear_cache():
    tweet_cache['data'] = []
    tweet_cache['last_fetch'] = None
    rate_limit_tracker['last_request_time'] = None
    return jsonify({'status': 'success', 'message': 'Cache cleared'})

@app.route('/process-text', methods=['POST'])
def process_text():
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
    try:
        data = request.json
        if not data or 'reports' not in data or len(data['reports']) < 3:
            return jsonify({'hotspots': [], 'message': 'Insufficient data (minimum 3 reports required)'}), 400
        
        reports = data['reports']
        hotspots = find_hotspots(reports)
        return jsonify({'hotspots': hotspots})
    except Exception as e:
        return jsonify({'error': f'Hotspot analysis failed: {str(e)}'}), 500

@app.route('/chat', methods=['POST'])
def chat_route():
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

# --- Run the Server ---
if __name__ == '__main__':
    app.run(port=5001, debug=True)