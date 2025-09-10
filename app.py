from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os
from db import db, init_db
from routes import bp

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

load_dotenv()
app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['PERPLEXITY_API_KEY'] = os.getenv('PERPLEXITY_API_KEY')
app.config['CONTENT_FILE'] = os.getenv('CONTENT_FILE')
app.config['SESSION_COOKIE_SECURE'] = True
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

init_db(app)
app.register_blueprint(bp)

if __name__ == "__main__":
    app.run(debug=True)
