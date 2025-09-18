import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import os

# Load model and tokenizer
MODEL_PATH = 'models/indicbert'
tokenizer = None
model = None

def load_model():
    global tokenizer, model
    if tokenizer is None or model is None:
        try:
            tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
            model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
            model.eval()
        except Exception as e:
            print(f"Error loading model: {e}")
            raise

def classify_text(text):
    """
    Classify text using fine-tuned IndicBERT
    Returns: (classification_label, confidence_score)
    """
    if not text or not text.strip():
        return None, None
    
    try:
        load_model()
        
        # Tokenize input
        inputs = tokenizer(
            text, 
            return_tensors="pt", 
            truncation=True, 
            padding=True,
            max_length=512
        )
        
        # Get prediction
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probabilities = torch.softmax(logits, dim=1)
            
            # Get predicted class and confidence
            predicted_class = torch.argmax(logits, dim=1).item()
            confidence = probabilities[0][predicted_class].item()
            
        return str(predicted_class), confidence
        
    except Exception as e:
        print(f"Classification error: {e}")
        return None, None