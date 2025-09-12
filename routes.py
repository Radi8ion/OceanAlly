from flask import Blueprint, request, jsonify
from utils.classifier import classify_text
from utils.location import reverse_geocode, get_location_from_ip  # Fixed import
from utils.sentiment import analyze_sentiment, get_urgency_level
from utils.clustering import find_hotspots
from datetime import datetime
import uuid

bp = Blueprint('main', __name__)

@bp.route('/report', methods=['POST'])
def report_hazard():
    try:
        data = request.json
        text_description = data.get('description', '')
        image_url = data.get('image_url', '')
        
        # Get precise location from frontend (GPS coordinates)
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if not latitude or not longitude:
            return jsonify({"error": "Location coordinates are required"}), 400
        
        # Get detailed location information
        location_details = reverse_geocode(latitude, longitude)
        
        # Initialize classification and sentiment
        classification = None
        classification_confidence = None
        sentiment_score = None
        urgency_level = None
        
        # Process text if provided
        if text_description and text_description.strip():
            # Classify relevance using IndicBERT
            classification, classification_confidence = classify_text(text_description)
            
            # Analyze sentiment and urgency
            sentiment_score = analyze_sentiment(text_description)
            urgency_level = get_urgency_level(sentiment_score, classification)
        
        # Create report entry
        report_entry = {
            "_id": str(uuid.uuid4()),
            "description": text_description,
            "image_url": image_url,
            "classification": {
                "label": classification,
                "confidence": classification_confidence,
                "labels_map": {"0": "not_relevant", "1": "relevant", "2": "highly_relevant"}
            },
            "sentiment": {
                "score": sentiment_score,
                "urgency_level": urgency_level
            },
            "location": {
                "coordinates": {
                    "latitude": float(latitude),
                    "longitude": float(longitude)
                },
                "address": location_details
            },
            "timestamp": datetime.utcnow(),
            "status": "pending"  # pending, verified, resolved
        }
        
        # Store in MongoDB
        from app import mongo
        result = mongo.db.reports.insert_one(report_entry)
        
        return jsonify({
            "message": "Hazard report submitted successfully",
            "report_id": report_entry["_id"],
            "classification": classification,
            "urgency_level": urgency_level,
            "location": location_details
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/hotspots', methods=['GET'])
def get_hotspots():
    """Get hazard hotspots using clustering"""
    try:
        from app import mongo
        
        # Get recent reports (last 30 days)
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        reports = list(mongo.db.reports.find({
            "timestamp": {"$gte": thirty_days_ago},
            "classification.label": {"$in": ["1", "2"]}  # Only relevant reports
        }))
        
        if len(reports) < 3:
            return jsonify({"hotspots": [], "message": "Insufficient data for clustering"})
        
        hotspots = find_hotspots(reports)
        
        return jsonify({
            "hotspots": hotspots,
            "total_reports": len(reports)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/get-location', methods=['GET'])
def get_current_location():
    """
    Endpoint to fetch user's location (primarily IP-based)
    Frontend can call this if GPS is not available
    """
    try:
        user_ip = request.remote_addr
        location_data = get_location_from_ip(user_ip)
        
        if location_data:
            return jsonify({
                "location": location_data,
                "message": "Location fetched successfully",
                "precision": "approximate"
            })
        else:
            return jsonify({"error": "Unable to determine location"}), 400
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/reports', methods=['GET'])  # FIXED: Added missing route decorator
def get_reports():
    """Get all reports with optional filtering"""
    try:
        from app import mongo
        
        # Query parameters
        classification_filter = request.args.get('classification')
        urgency_filter = request.args.get('urgency')
        limit = int(request.args.get('limit', 50))
        
        # Build query
        query = {}
        if classification_filter:
            query['classification.label'] = classification_filter
        if urgency_filter:
            query['sentiment.urgency_level'] = urgency_filter
        
        reports = list(mongo.db.reports.find(query)
                      .sort("timestamp", -1)
                      .limit(limit))
        
        return jsonify({
            "reports": reports,
            "count": len(reports)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500