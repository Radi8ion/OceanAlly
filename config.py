import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://localhost:27017/hazard_db'
    
    # Model configuration
    MODEL_PATH = os.environ.get('MODEL_PATH') or 'model/'
    
    # API configurations
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # Location service settings
    LOCATION_API_TIMEOUT = 10
    
    # Clustering parameters
    HOTSPOT_RADIUS_KM = 1.0
    MIN_REPORTS_FOR_HOTSPOT = 3