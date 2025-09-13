from flask import Flask, request, jsonify
# Make sure your utility scripts are in the same directory or accessible
from utils.classifier import classify_text
from utils.sentiment import analyze_sentiment, get_urgency_level
from utils.clustering import find_hotspots
from utils.chatbot import load_dataset, get_answer

app = Flask(__name__)
chatbot_dataset = load_dataset()

# Endpoint to process a report's text description
@app.route('/process-text', methods=['POST'])
def process_text():
    try:
        data = request.json
        text = data.get('description', '')
        if not text:
            return jsonify({"error": "Description is required"}), 400
            
        classification, confidence = classify_text(text)
        sentiment_score = analyze_sentiment(text)
        urgency_level = get_urgency_level(sentiment_score, classification)
        
        return jsonify({
            "classification": {"label": classification, "confidence": confidence},
            "sentiment": {"score": sentiment_score, "urgency_level": urgency_level}
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint to find hotspots using your clustering algorithm
@app.route('/find-hotspots', methods=['POST'])
def find_hotspots_cluster():
    try:
        reports = request.json.get('reports', [])
        if len(reports) < 3:
            return jsonify({"hotspots": [], "message": "Insufficient data for clustering"})
        
        hotspots = find_hotspots(reports) # Your original clustering function
        return jsonify({"hotspots": hotspots})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_input = data.get('message', '')
        if not user_input:
            return jsonify({"error": "Message is required"}), 400

        response = get_answer(chatbot_dataset, user_input)
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run on a port like 5001 to avoid conflicts with your Node app
    app.run(port=5001, debug=True)
