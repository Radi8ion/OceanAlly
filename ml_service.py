from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import torch
from datetime import datetime, timedelta
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import spacy
import json

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

QUERY = "(flood OR cyclone OR storm OR coastal OR erosion OR tsunami OR sea-level) lang:en"

# --- ML Model Setup ---
MODEL_PATH = 'model/'
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
    print("Model and tokenizer loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")
    tokenizer = None
    model = None

RELEVANCE_THRESHOLD = 0.5

# --- Load Indian Locations Dataset ---
with open('indian_locations.json', 'r', encoding='utf-8') as f:
    locations_data = json.load(f)

all_locations = set(locations_data['states'] + locations_data['union_territories'] + locations_data['coastal_cities'])

# --- Load NER Model ---
nlp = spacy.load('en_core_web_sm')

# --- Helper Functions ---
def is_cache_valid():
    if not tweet_cache['last_fetch']:
        return False
    elapsed = (datetime.utcnow() - tweet_cache['last_fetch']).total_seconds()
    return elapsed < tweet_cache['cache_duration_seconds']

def can_request_twitter():
    if not rate_limit_tracker['last_request_time']:
        return True, 0
    elapsed = (datetime.utcnow() - rate_limit_tracker['last_request_time']).total_seconds()
    if elapsed < rate_limit_tracker['cooldown_seconds']:
        wait = rate_limit_tracker['cooldown_seconds'] - elapsed
        return False, int(wait)
    return True, 0

def extract_locations(text):
    """Return all location entities in text."""
    doc = nlp(text)
    locations = [ent.text for ent in doc.ents if ent.label_ in ("GPE", "LOC")]
    return locations

def get_indian_locations(text):
    """Return list of Indian locations mentioned in text."""
    locations = extract_locations(text)
    indian_locs = [loc.strip() for loc in locations if loc.strip() in all_locations]
    return indian_locs

def is_relevant(text):
    """Check if text is relevant using IndicBERT model."""
    if not tokenizer or not model:
        return False
    try:
        inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
        with torch.no_grad():
            outputs = model(**inputs)
        scores = torch.softmax(outputs.logits, dim=1)
        relevance_score = scores[0][1].item()  # class 1 = relevant
        return relevance_score >= RELEVANCE_THRESHOLD
    except Exception as e:
        print(f"Error in relevance check: {e}")
        return False

# --- Routes ---
@app.route('/recent-tweets', methods=['GET'])
def recent_tweets():
    if not TWITTER_BEARER_TOKEN:
        return jsonify({'status': 'error', 'message': 'Twitter credentials missing'}), 500

    if is_cache_valid():
        return jsonify({'status': 'success', 'tweets': tweet_cache['data'], 'source': 'cache'})

    can_req, wait = can_request_twitter()
    if not can_req:
        if tweet_cache['data']:
            return jsonify({'status': 'success', 'tweets': tweet_cache['data'],
                            'message': f'Rate limit hit. Retry after {wait}s', 'source': 'stale-cache'})
        else:
            return jsonify({'status': 'error', 'message': f'Rate limit hit. Retry after {wait}s'}), 429

    try:
        one_month_ago =datetime.utcnow() - timedelta(days=30)  # past 1 month
        start_time = one_month_ago.isoformat("T") + "Z"
        params = {
            'query': QUERY,
            'start_time': start_time,
            'max_results': 15,
            'tweet.fields': 'created_at,text'
        }
        rate_limit_tracker['last_request_time'] = datetime.utcnow()
        response = requests.get(TWITTER_SEARCH_URL, headers=HEADERS, params=params, timeout=10)
        if response.status_code != 200:
            return jsonify({'status': 'error', 'message': 'Twitter API error', 'detail': response.text}), response.status_code

        data = response.json()
        filtered = []
        for tweet in data.get('data', []):
            text = tweet.get('text', '')
            indian_locations = get_indian_locations(text)
            if is_relevant(text) and indian_locations:
                filtered.append({
                    'description': text,
                    'location': indian_locations,
                    'time': tweet.get('created_at', '')
                })

        tweet_cache['data'] = filtered
        tweet_cache['last_fetch'] = datetime.utcnow()
        return jsonify({'status': 'success', 'tweets': filtered, 'source': 'live'})

    except requests.exceptions.Timeout:
        return jsonify({'status': 'error', 'message': 'Twitter API timeout'}), 408
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/recent-videos', methods=['GET'])
def recent_videos():
    one_month_ago = datetime.utcnow() - timedelta(days=30)
    published_after = one_month_ago.isoformat("T") + "Z"

    YOUTUBE_API_KEY = 'AIzaSyC8aIJTmSKJpQYyaKqxYFNHP96beJy1-y8'  # Replace with actual key or use environment variables
    YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search'

    QUERY = "flood OR cyclone OR storm OR coastal OR erosion OR tsunami OR sea-level"
    MAX_RESULTS = 15

    params = {
        'part': 'snippet',
        'q': QUERY,
        'type': 'video',
        'publishedAfter': published_after,
        'maxResults': MAX_RESULTS,
        'regionCode': 'IN',
        'key': YOUTUBE_API_KEY
    }

    try:
        response = requests.get(YOUTUBE_SEARCH_URL, params=params, timeout=10)
        data = response.json()
        print(data)
        if response.status_code != 200:
            return jsonify({'status': 'error', 'message': 'YouTube API error', 'detail': response.text}), response.status_code

        data = response.json()
        filtered = []
        for item in data.get('items', []):
            snippet = item.get('snippet', {})
            description = snippet.get('description', "")
            indian_locations = get_indian_locations(description)

            if is_relevant(description) and indian_locations:
                filtered.append({
                    'videoId': item['id']['videoId'],
                    'title': snippet.get('title', ""),
                    'description': description,
                    'publishedAt': snippet.get('publishedAt', ""),
                    'thumbnail': snippet.get('thumbnails', {}).get('default', {}).get('url', ""),
                    'location': indian_locations
                })

        return jsonify({'status': 'success', 'videos': filtered})
    except requests.exceptions.Timeout:
        return jsonify({'status': 'error', 'message': 'YouTube API timeout'}), 408
    except Exception as e:
        print(e)
        return jsonify({'status': 'error', 'message': str(e)}), 500

    

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'chatbot_loaded': chatbot_dataset is not None,
        'model_loaded': tokenizer is not None and model is not None,
        'twitter_configured': bool(TWITTER_BEARER_TOKEN)
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

@app.route('/find-hotspots', methods=['POST'])
def find_hotspots_route():
    data = request.json
    if not data or 'reports' not in data or len(data['reports']) < 3:
        return jsonify({'hotspots': [], 'message': 'Insufficient data'}), 400
    reports = data['reports']
    hotspots = find_hotspots(reports)
    return jsonify({'hotspots': hotspots})

@app.route('/chat', methods=['POST'])
def chat_route():
    if not chatbot_dataset:
        return jsonify({'error': 'Chatbot not available'}), 503
    data = request.json
    if not data or 'message' not in data:
        return jsonify({'error': 'Message required'}), 400
    user_input = data['message']
    response = get_answer(chatbot_dataset, user_input)
    return jsonify({'response': response})

# --- Run the Server ---
if __name__ == '__main__':
    app.run(port=5001, debug=True)
