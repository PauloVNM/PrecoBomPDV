from flask import Flask
from app.database import init_db

app = Flask(__name__)

with app.app_context():
    init_db()

from app.routes import routes_bp
app.register_blueprint(routes_bp)