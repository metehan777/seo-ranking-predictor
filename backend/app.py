from flask import Flask, jsonify, render_template, send_from_directory, request
from flask_cors import CORS
from routes.api import api_bp
from models.database import db
import config
import os
from datetime import datetime
import logging
import numpy as np
import json

# Configure logging first
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create a custom JSON encoder that handles NumPy types
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, np.bool_):
            return bool(obj)
        return super().default(obj)

app = Flask(__name__)
app.config.from_object(config.Config)
app.json_encoder = CustomJSONEncoder

# Simple CORS configuration - allow all origins, methods, and headers
app.config['CORS_HEADERS'] = 'Content-Type'
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize the database
db.init_app(app)

# Request logging
@app.before_request
def log_request_info():
    logger.debug('Headers: %s', request.headers)
    logger.debug('Body: %s', request.get_data())

@app.after_request
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    logger.debug('Response: %s', response.get_data())
    return response

# Special handler for OPTIONS requests (CORS preflight)
@app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    return '', 200

# Register the API blueprint
app.register_blueprint(api_bp, url_prefix='/api')

@app.route('/')
def index():
    """Serve HTML documentation page"""
    endpoints = [
        {"path": "/api/keywords", "methods": ["GET", "POST"], "description": "List or add keywords"},
        {"path": "/api/keywords/<id>/rankings", "methods": ["GET"], "description": "Get rankings for a keyword"},
        {"path": "/api/keywords/<id>/fetch", "methods": ["POST"], "description": "Fetch new rankings"},
        {"path": "/api/keywords/<id>/predict", "methods": ["GET"], "description": "Get ranking predictions"}
    ]
    
    return render_template('index.html', 
                          endpoints=endpoints, 
                          version="1.0", 
                          year=datetime.now().year)

@app.route('/health')
def health():
    return jsonify({"status": "ok"})

# Add this after imports for debugging
print("Loaded environment variables:")
print(f"DEBUG: {os.getenv('DEBUG')}")
print(f"SECRET_KEY: {os.getenv('SECRET_KEY') != None}")
print(f"DATABASE_URL: {os.getenv('DATABASE_URL')}")
print(f"SERPAPI_KEY: {os.getenv('SERPAPI_KEY') != None}")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    print(f"Current working directory: {os.getcwd()}")
    print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
    app.run(debug=app.config['DEBUG'], port=5001) 