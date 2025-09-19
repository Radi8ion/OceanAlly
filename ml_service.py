import os
import re
import json
import pandas as pd
from datetime import datetime, timedelta, timezone

# --- Core Flask and Web Libraries ---
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
from dotenv import load_dotenv
import subprocess
import tempfile
from pydub import AudioSegment
import wave

# --- Machine Learning & NLP Libraries ---
import torch
import spacy
from PIL import Image
from transformers import (
    AutoTokenizer, AutoModelForSequenceClassification,
    BlipProcessor, BlipForConditionalGeneration
)
from sentence_transformers import SentenceTransformer, util

# --- Azure Speech Services ---
import azure.cognitiveservices.speech as speechsdk

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

# --- Azure Speech Configuration ---
AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_SERVICE_REGION = os.getenv("AZURE_SERVICE_REGION")

# --- YOUTUBE CONSTANTS ---
YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_QUERY = '"natural disaster" OR "monsoon flood" OR cyclone OR tsunami OR earthquake OR landslide india -sports -wnba -seattle'
MAX_RESULTS = 15

# --- CACHE SETUP ---
social_media_cache = {
    'reddit': {'data': [], 'last_fetch': None, 'cache_duration': 600},
    'gnews': {'data': [], 'last_fetch': None, 'cache_duration': 1800},
    'youtube': {'data': [], 'last_fetch': None, 'cache_duration': 1800}
}

# --- Create directories for audio files ---
os.makedirs("static/audio", exist_ok=True)

# --- Chatbot Setup (Original + Azure) ---
try:
    chatbot_dataset = load_dataset()
    print("✅ Original chatbot dataset loaded successfully")
except Exception as e:
    print(f"❌ Error loading original chatbot dataset: {e}")
    chatbot_dataset = None

# --- Azure Chatbot Setup ---
try:
    # Load Azure-based chatbot dataset
    AZURE_CSV_PATH = "data/chatbot.csv"
    if os.path.exists(AZURE_CSV_PATH):
        azure_df = pd.read_csv(AZURE_CSV_PATH)
        azure_questions = azure_df["Question"].tolist()
        azure_answers = azure_df["Answer"].tolist()
        print(f"✅ Azure chatbot dataset loaded with {len(azure_answers)} Q&A pairs")
    else:
        azure_questions = []
        azure_answers = []
        print("❌ Azure chatbot CSV not found")
    
    # Load fine-tuned SentenceTransformer model for Azure chatbot
    AZURE_MODEL_PATH = "models2/"
    if os.path.exists(AZURE_MODEL_PATH):
        azure_model = SentenceTransformer(AZURE_MODEL_PATH)
        # Precompute embeddings for answers
        azure_answer_embeddings = azure_model.encode(azure_answers, convert_to_tensor=True) if azure_answers else None
        print("✅ Azure SentenceTransformer model loaded successfully")
    else:
        azure_model = None
        azure_answer_embeddings = None
        print("❌ Azure model not found at ./models2")
        
except Exception as e:
    print(f"❌ Error setting up Azure chatbot: {e}")
    azure_model = None
    azure_answer_embeddings = None
    azure_answers = []

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

# --- AUDIO CONVERSION HELPER FUNCTIONS ---
def convert_to_wav(input_path):
    """Convert audio file to WAV format compatible with Azure Speech Services."""
    try:
        # Check if file exists and has content
        if not os.path.exists(input_path) or os.path.getsize(input_path) == 0:
            print("❌ Audio file is empty or doesn't exist")
            return None
            
        # Get file extension
        file_ext = os.path.splitext(input_path)[1].lower()
        
        # If already WAV, check if it's valid
        if file_ext == '.wav':
            if is_valid_wav(input_path):
                return input_path
        
        # Use pydub to convert (handles most formats)
        try:
            audio = AudioSegment.from_file(input_path)
            
            # Ensure proper format for Azure Speech Services
            audio = audio.set_frame_rate(16000)  # 16kHz sample rate
            audio = audio.set_channels(1)        # Mono
            audio = audio.set_sample_width(2)    # 16-bit
            
            # Create temporary WAV file
            output_path = input_path.rsplit('.', 1)[0] + '_converted.wav'
            audio.export(output_path, format="wav")
            
            print(f"✅ Audio converted: {input_path} -> {output_path}")
            return output_path
            
        except Exception as e:
            print(f"❌ Pydub conversion failed: {e}")
            # Fallback to ffmpeg if available
            return convert_with_ffmpeg(input_path)
            
    except Exception as e:
        print(f"❌ Audio conversion error: {e}")
        return None

def convert_with_ffmpeg(input_path):
    """Fallback conversion using ffmpeg."""
    try:
        output_path = input_path.rsplit('.', 1)[0] + '_converted.wav'
        subprocess.run([
            'ffmpeg', '-i', input_path, 
            '-ar', '16000',  # 16kHz sample rate
            '-ac', '1',      # Mono
            '-f', 'wav',     # WAV format
            '-y',            # Overwrite output file
            output_path
        ], check=True, capture_output=True)
        
        print(f"✅ FFmpeg conversion successful: {output_path}")
        return output_path
        
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"❌ FFmpeg conversion failed: {e}")
        return None

def is_valid_wav(file_path):
    """Check if WAV file is valid and has proper format."""
    try:
        with wave.open(file_path, 'rb') as wav_file:
            frames = wav_file.getnframes()
            sample_rate = wav_file.getframerate()
            channels = wav_file.getnchannels()
            sample_width = wav_file.getsampwidth()
            
            print(f"📊 WAV info: {frames} frames, {sample_rate}Hz, {channels} channels, {sample_width} bytes/sample")
            
            # Check if file has audio content
            return frames > 0 and sample_rate > 0
            
    except Exception as e:
        print(f"❌ WAV validation failed: {e}")
        return False

# --- AZURE SPEECH HELPER FUNCTIONS ---
def get_best_answer_azure(query: str, threshold: float = 0.3):
    """Find the most relevant answer using Azure model embedding similarity."""
    if not azure_model or azure_answer_embeddings is None or not azure_answers:
        print("❌ Azure chatbot not available")
        return "OceanAlly can't respond to that now 🌊🐙"
    
    try:
        print(f"🔍 Processing query: '{query}' with Azure model")
        
        query_embedding = azure_model.encode(query, convert_to_tensor=True)
        similarities = util.pytorch_cos_sim(query_embedding, azure_answer_embeddings)[0]

        # Convert to CPU and extract values to avoid tensor boolean issues
        similarities_cpu = similarities.cpu()
        best_idx = torch.argmax(similarities_cpu).item()
        best_score = similarities_cpu[best_idx].item()

        print(f"🔍 Best match: index={best_idx}, score={best_score:.4f}, threshold={threshold}")
        
        if best_idx < len(azure_answers):
            selected_answer = azure_answers[best_idx]
            print(f"🔍 Selected answer: '{selected_answer}'")
        else:
            print("❌ Index out of bounds")
            return "OceanAlly can't respond to that now 🌊🐙"
        
        # Use .item() to convert tensor to Python scalar for comparison
        if best_score < threshold:
            print(f"❌ Score {best_score:.4f} below threshold {threshold}")
            return "OceanAlly can't respond to that now 🌊🐙"

        print(f"✅ Returning answer: '{selected_answer}'")
        return selected_answer
        
    except Exception as e:
        print(f"❌ Error in Azure answer matching: {e}")
        import traceback
        traceback.print_exc()
        return "Sorry, I'm experiencing some technical difficulties."

def speech_to_text(audio_file_path):
    """Convert speech (WAV/MP3/WebM) to text using Azure Cognitive Services."""
    if not AZURE_SPEECH_KEY or not AZURE_SERVICE_REGION:
        print("❌ Azure Speech Services not configured")
        return None
    
    try:
        # Convert audio to WAV format if needed
        converted_path = convert_to_wav(audio_file_path)
        if not converted_path:
            print("❌ Audio conversion failed")
            return None
            
        # Configure Azure Speech
        speech_config = speechsdk.SpeechConfig(subscription=AZURE_SPEECH_KEY, region=AZURE_SERVICE_REGION)
        speech_config.speech_recognition_language = "en-US"
        
        # Use the converted audio file
        audio_config = speechsdk.audio.AudioConfig(filename=converted_path)
        speech_recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

        print(f"🎙️ Processing audio file: {converted_path}")
        result = speech_recognizer.recognize_once()
        
        # Clean up converted file if it's different from original
        if converted_path != audio_file_path:
            try:
                os.remove(converted_path)
            except:
                pass
                
        if result.reason == speechsdk.ResultReason.RecognizedSpeech:
            print(f"✅ Speech recognized: {result.text}")
            return result.text
        elif result.reason == speechsdk.ResultReason.NoMatch:
            print("❌ No speech could be recognized")
            return None
        elif result.reason == speechsdk.ResultReason.Canceled:
            cancellation_details = speechsdk.CancellationDetails(result)
            print(f"❌ Speech Recognition canceled: {cancellation_details.reason}")
            if cancellation_details.reason == speechsdk.CancellationReason.Error:
                print(f"❌ Error details: {cancellation_details.error_details}")
            return None
            
    except Exception as e:
        print(f"❌ Error in speech to text: {e}")
        import traceback
        traceback.print_exc()
        return None

def text_to_speech(text, filename="static/audio/response.wav"):
    """Convert text answer to speech and save as audio file."""
    if not AZURE_SPEECH_KEY or not AZURE_SERVICE_REGION:
        return None
    
    try:
        speech_config = speechsdk.SpeechConfig(subscription=AZURE_SPEECH_KEY, region=AZURE_SERVICE_REGION)
        speech_config.speech_synthesis_voice_name = "en-US-AriaNeural"  # Change voice if needed
        audio_config = speechsdk.audio.AudioOutputConfig(filename=filename)

        synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)
        result = synthesizer.speak_text_async(text).get()
        
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            return filename
        else:
            print(f"Speech synthesis failed: {result.reason}")
            return None
    except Exception as e:
        print(f"Error in text to speech: {e}")
        import traceback
        traceback.print_exc()
        return None

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

    DISASTER_KEYWORDS = [
        'flood', 'cyclone', 'tsunami', 'earthquake', 'landslide', 'disaster',
        'erosion', 'tremor', 'quake', 'deluge', 'inundation', 'monsoon fury', 'cloudburst'
    ]

    # --- Get Reddit data ---
    reddit_data = {}
    try:
        if is_social_cache_valid('reddit'):
            reddit_data = {"status": "success", "posts": social_media_cache['reddit']['data'], "cached": True}
        else:
            reddit = praw.Reddit(
                client_id=os.getenv("REDDIT_CLIENT_ID"),
                client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
                user_agent=os.getenv("REDDIT_USER_AGENT")
            )
            subreddits = reddit.subreddit("india+worldnews+news+IndiaSpeaks+IndiaNews+climate+environment")
            
            hot_posts = subreddits.hot(limit=200) 
            
            relevant_posts = []
            for post in hot_posts:
                if not post.stickied:
                    title = post.title or ""
                    selftext = post.selftext or ""
                    full_text = f"{title} {selftext}".lower()
                    
                    indian_locations = get_indian_locations(full_text)
                    
                    has_indian_connection = indian_locations or any(sub in post.subreddit.display_name.lower() for sub in ['india', 'indiaspeaks', 'indianews'])
                    has_disaster_keyword = any(keyword in full_text for keyword in DISASTER_KEYWORDS)

                    if has_indian_connection and has_disaster_keyword:
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
        import traceback
        traceback.print_exc()
        reddit_data = {"status": "error", "message": f"Error fetching Reddit posts: {str(e)}", "posts": []}

    feeds["reddit"] = {"status": reddit_data.get("status"), "data": reddit_data.get("posts", []), "count": len(reddit_data.get("posts", [])), "message": reddit_data.get("message")}
    
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
                    "q": YOUTUBE_QUERY,
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

        # 2. Analyze caption with IndicBERT
        classification_label, confidence = classify_text(caption)
        sentiment_score = analyze_sentiment(caption)
        urgency_level = get_urgency_level(sentiment_score, classification_label)

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

# --- INTEGRATED CHATBOT ROUTES ---
@app.route('/chat', methods=['POST'])
def chat_route():
    """Integrated chatbot endpoint with Azure TTS support"""
    try:
        data = request.json
        if not data or 'message' not in data:
            return jsonify({'error': 'Message required'}), 400
       
        user_input = data['message']
        
        # Try Azure chatbot first, then fallback to original
        if azure_model is not None and azure_answer_embeddings is not None:
            response = get_best_answer_azure(user_input)
        elif chatbot_dataset:
            response = get_answer(chatbot_dataset, user_input)
        else:
            response = "I'm sorry, the chatbot service is currently unavailable."
        
        # Generate audio response if Azure is configured
        audio_file = None
        if AZURE_SPEECH_KEY and AZURE_SERVICE_REGION:
            timestamp = int(datetime.now().timestamp())
            audio_filename = f"static/audio/response_{timestamp}.wav"
            audio_file = text_to_speech(response, audio_filename)
        
        return jsonify({
            'response': response,
            'audio': audio_file.replace('static/', '') if audio_file else None
        })
        
    except Exception as e:
        print(f"Chat processing error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Chat processing failed: {str(e)}'}), 500

# --- REQUEST TRACKING (Add after imports) ---
import threading
request_lock = threading.Lock()
active_requests = set()

@app.route('/speech-to-text', methods=['POST'])
def speech_to_text_route():
    """Convert uploaded audio to text using Azure Speech Services"""
    
    # Generate unique request ID
    request_id = f"req_{int(datetime.now().timestamp() * 1000)}"
    
    with request_lock:
        if request_id in active_requests:
            print(f"❌ Duplicate request detected: {request_id}")
            return jsonify({"error": "Request already processing"}), 429
        active_requests.add(request_id)
    
    try:
        print(f"🔄 Starting request: {request_id}")
        
        if not AZURE_SPEECH_KEY or not AZURE_SERVICE_REGION:
            return jsonify({'error': 'Azure Speech Services not configured'}), 503
        
        if "file" not in request.files:
            return jsonify({"error": "No audio file uploaded"}), 400

        audio_file = request.files["file"]
        if audio_file.filename == '':
            return jsonify({"error": "No file selected"}), 400
                
        # Validate file size (max 25MB)
        if audio_file.content_length and audio_file.content_length > 25 * 1024 * 1024:
            return jsonify({"error": "File too large. Maximum size is 25MB"}), 400
        
        timestamp = int(datetime.now().timestamp())
        
        # Save with proper extension detection
        original_filename = audio_file.filename or "recording.webm"
        file_ext = os.path.splitext(original_filename)[1] or '.webm'
        file_path = os.path.join("static/audio", f"upload_{timestamp}{file_ext}")
        
        audio_file.save(file_path)
        
        # Check file size after saving
        if os.path.getsize(file_path) == 0:
            os.remove(file_path)
            return jsonify({"error": "Uploaded file is empty"}), 400

        print(f"🎤 [{request_id}] Processing uploaded audio: {file_path} ({os.path.getsize(file_path)} bytes)")

        # Convert speech to text
        text = speech_to_text(file_path)
        if not text or not text.strip():
            return jsonify({"error": "Speech could not be recognized. Please try speaking clearly."}), 400

        print(f"✅ [{request_id}] Speech recognized: '{text}'")

        # Get chatbot response - ensure single response
        answer = None
        try:
            print(f"🔍 [{request_id}] Getting response for query: '{text}'")
            if azure_model is not None and azure_answer_embeddings is not None:
                print(f"🔵 [{request_id}] Using Azure chatbot")
                answer = get_best_answer_azure(text)
                print(f"🔵 [{request_id}] Azure response: '{answer}'")
            elif chatbot_dataset:
                print(f"🟡 [{request_id}] Using original chatbot")
                answer = get_answer(chatbot_dataset, text)
                print(f"🟡 [{request_id}] Original response: '{answer}'")
            else:
                answer = "I'm sorry, the chatbot service is currently unavailable."
                print(f"🔴 [{request_id}] No chatbot available")
                
            # Validate the answer
            if not answer or answer.strip() == "" or answer.strip() == "None":
                answer = "I didn't understand that. Could you please rephrase your question?"
                print(f"⚠️ [{request_id}] Using fallback response")
                
            print(f"✅ [{request_id}] Final answer: '{answer}'")
                
        except Exception as chatbot_error:
            print(f"❌ [{request_id}] Chatbot error: {chatbot_error}")
            import traceback
            traceback.print_exc()
            answer = "I'm experiencing some technical difficulties. Please try again."

        # Generate audio response
        audio_response_file = None
        try:
            audio_response_file = text_to_speech(answer, f"static/audio/response_{timestamp}.wav")
            print(f"🔊 [{request_id}] Audio generated: {audio_response_file}")
        except Exception as tts_error:
            print(f"⚠️ [{request_id}] TTS failed but continuing: {tts_error}")

        # Clean up uploaded file
        try:
            os.remove(file_path)
        except:
            pass

        # Return single response
        response_data = {
            "query": text,
            "answer": answer,
            "audio": audio_response_file.replace('static/', '') if audio_response_file else None,
            "request_id": request_id  # Add for debugging
        }
        
        print(f"✅ [{request_id}] Returning response: {response_data}")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"❌ [{request_id}] Speech processing error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Speech processing failed. Please try again."}), 500
        
    finally:
        # Clean up request tracking
        with request_lock:
            active_requests.discard(request_id)
        print(f"🏁 [{request_id}] Request completed")

# --- AZURE TEST ENDPOINT ---
@app.route('/test-azure-speech', methods=['GET'])
def test_azure_speech():
    """Test Azure Speech Services configuration"""
    if not AZURE_SPEECH_KEY or not AZURE_SERVICE_REGION:
        return jsonify({
            'status': 'error',
            'message': 'Azure Speech Services not configured',
            'keys_present': {
                'AZURE_SPEECH_KEY': bool(AZURE_SPEECH_KEY),
                'AZURE_SERVICE_REGION': bool(AZURE_SERVICE_REGION)
            }
        }), 400
    
    try:
        # Test TTS
        test_text = "Hello, this is a test of Azure Text-to-Speech service."
        timestamp = int(datetime.now().timestamp())
        test_audio_file = f"static/audio/test_tts_{timestamp}.wav"
        
        audio_file = text_to_speech(test_text, test_audio_file)
        
        if audio_file:
            return jsonify({
                'status': 'success',
                'message': 'Azure Speech Services working correctly',
                'test_audio': audio_file.replace('static/', ''),
                'config': {
                    'region': AZURE_SERVICE_REGION,
                    'key_length': len(AZURE_SPEECH_KEY) if AZURE_SPEECH_KEY else 0
                }
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Text-to-speech test failed'
            }), 500
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Azure Speech test failed: {str(e)}'
        }), 500

# --- STATIC FILE SERVING ---
@app.route('/audio/<path:filename>')
def serve_audio(filename):
    """Serve audio files"""
    return send_from_directory('static/audio', filename)

# --- UTILITY ROUTES ---
@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'chatbot_loaded': chatbot_dataset is not None,
        'azure_chatbot_loaded': azure_model is not None and len(azure_answers) > 0,
        'indicbert_loaded': tokenizer is not None and model is not None,
        'blip_loaded': blip_processor is not None and blip_model is not None,
        'spacy_loaded': nlp is not None,
        'locations_loaded': len(all_locations) > 0,
        'azure_speech_configured': bool(AZURE_SPEECH_KEY and AZURE_SERVICE_REGION),
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
            "/live-feeds": "GET - Get all social media feeds in one response"
        },
        "ai_processing_endpoints": {
            "/analyze_image": "POST - Analyze uploaded image using BLIP + IndicBERT",
            "/process-text": "POST - Process text for classification and sentiment",
            "/find-hotspots": "POST - Find disaster hotspots from reports"
        },
        "chatbot_endpoints": {
            "/chat": "POST - Integrated chatbot with Azure TTS support",
            "/speech-to-text": "POST - Convert audio to text and get chatbot response"
        },
        "utility_endpoints": {
            "/health": "GET - System health check",
            "/cache-status": "GET - View cache status for all platforms",
            "/clear-cache": "POST - Clear all caches",
            "/clear-cache/<platform>": "POST - Clear cache for specific platform",
            "/audio/<filename>": "GET - Serve audio files",
            "/test-azure-speech": "GET - Test Azure Speech Services configuration",
            "/api-docs": "GET - This documentation"
        },
        "required_env_variables": {
            "REDDIT_CLIENT_ID": "Reddit API client ID",
            "REDDIT_CLIENT_SECRET": "Reddit API client secret", 
            "REDDIT_USER_AGENT": "Reddit API user agent",
            "GNEWS_API_KEY": "Google News API key",
            "YOUTUBE_API_KEY": "YouTube Data API v3 key",
            "AZURE_SPEECH_KEY": "Azure Cognitive Services Speech key",
            "AZURE_SERVICE_REGION": "Azure service region (e.g., 'eastus')"
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

# --- DEVELOPMENT ROUTES (debug mode only) ---
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
        },
        'azure_chatbot': {
            'loaded': azure_model is not None and len(azure_answers) > 0,
            'answers_count': len(azure_answers) if azure_answers else 0
        },
        'azure_speech': {
            'configured': bool(AZURE_SPEECH_KEY and AZURE_SERVICE_REGION),
            'tts_available': bool(AZURE_SPEECH_KEY and AZURE_SERVICE_REGION),
            'stt_available': bool(AZURE_SPEECH_KEY and AZURE_SERVICE_REGION)
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
    
    # Test Azure chatbot
    if results['azure_chatbot']['loaded']:
        try:
            test_response = get_best_answer_azure("What should I do during a tsunami?")
            results['azure_chatbot']['test_response'] = test_response
        except Exception as e:
            results['azure_chatbot']['error'] = str(e)
    
    return jsonify(results)

# --- Run the Server ---
if __name__ == '__main__':
    print("🚀 Starting Integrated Disaster Management Flask Server...")
    print(f"📊 Models loaded:")
    print(f"   - IndicBERT: {model is not None}")
    print(f"   - BLIP: {blip_model is not None}")
    print(f"   - Spacy: {nlp is not None}")
    print(f"   - Original Chatbot: {chatbot_dataset is not None}")
    print(f"   - Azure Chatbot: {azure_model is not None and len(azure_answers) > 0}")
    print(f"🔧 APIs configured:")
    print(f"   - Reddit: {bool(REDDIT_CLIENT_ID)}")
    print(f"   - YouTube: {bool(YOUTUBE_API_KEY)}")
    print(f"   - GNews: {bool(GNEWS_API_KEY)}")
    print(f"   - Azure Speech: {bool(AZURE_SPEECH_KEY and AZURE_SERVICE_REGION)}")
    print(f"📍 Indian locations loaded: {len(all_locations)}")
    print("🌐 Server running on http://localhost:5001")
    print("📖 API Documentation: http://localhost:5001/api-docs")
    print("🧪 Test Azure Speech: http://localhost:5001/test-azure-speech")
    
    app.run(port=5001, debug=True)