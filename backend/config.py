import os
from pathlib import Path

# Load .env from project root (parent of backend/)
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(_env_path)


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY") or "dev-secret-change-in-production"
    # Use DATABASE_URL for PostgreSQL, e.g. postgresql://user:password@localhost:5432/property_market
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or os.environ.get(
        "SQLALCHEMY_DATABASE_URI"
    ) or "postgresql://postgres:admin@localhost:5432/property_market"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY") or "jwt-secret-change-in-production"
    JWT_ACCESS_TOKEN_EXPIRES = 60 * 60 * 24  # 1 day
