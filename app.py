from flask import Flask
from flask_pymongo import PyMongo
from flask_cors import CORS

app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb://localhost:27017/hazard_db"
app.config["SECRET_KEY"] = "your-secret-key-here"

mongo = PyMongo(app)
CORS(app)  

from routes import bp
app.register_blueprint(bp)

if __name__ == '__main__':
    app.run(debug=True)