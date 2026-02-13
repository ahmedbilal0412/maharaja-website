import os
from pathlib import Path

from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from config import Config

db = SQLAlchemy()
jwt = JWTManager()


def _cors_origins():
    raw = os.environ.get("CORS_ORIGINS", "").strip()
    if raw:
        return [o.strip() for o in raw.split(",") if o.strip()]
    # Sensible defaults for local dev (frontend on 5500/3000)
    return [
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://maharajabuilders.pk",
        "http://maharajabuilders.pk"
    ]


def create_app(config_class=Config):
    # Serve uploaded files from backend/uploads via /uploads/...
    app = Flask(__name__, static_folder="uploads")
    app.config.from_object(config_class)
    CORS(app, origins=_cors_origins(), supports_credentials=True)

    db.init_app(app)
    jwt.init_app(app)

    from app.routes.auth import auth_bp
    from app.routes.properties import properties_bp
    from app.routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix="/api/users")
    app.register_blueprint(properties_bp, url_prefix="/api/properties")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    with app.app_context():
        db.create_all()
        from app.models import seed_admin_if_needed

        seed_admin_if_needed()

    return app
