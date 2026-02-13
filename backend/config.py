import os
from pathlib import Path

# Load .env from project root (parent of backend/)
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(_env_path)

if os.environ.get('RENDER') is None:
    load_dotenv()


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY") or "dev-secret-change-in-production"

    # Use DATABASE_URL for my-sql, e.g. mysql+pymysql://user:password@localhost:5432/property_market
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or os.environ.get(
        "SQLALCHEMY_DATABASE_URI"
    ) or "mysql+pymysql://u572739771_admin:/NZddzd7pV@srv2093.hstgr.io/u572739771_property_marke"

    # Connection pool settings for remote MySQL
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 5,
        'pool_recycle': 280,  # Recycle connections every 280 seconds
        'pool_pre_ping': True,  # Verify connections before using
        'connect_args': {
            'connect_timeout': 10
        }
    }

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY") or "jwt-secret-change-in-production"
    JWT_ACCESS_TOKEN_EXPIRES = 60 * 60 * 24  # 1 day
