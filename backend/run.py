import os
import sys

# Ensure backend root is on path so "config" and "app" resolve
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app

app = create_app()
print(f" Environment: {'development' if app.debug else 'production'}")
print(f" Database: {app.config['SQLALCHEMY_DATABASE_URI']}")

if __name__ == "__main__":
    host = os.environ.get("FLASK_HOST", "0.0.0.0")
    port = int(os.environ.get("FLASK_PORT", "5000"))
    debug = os.environ.get("FLASK_DEBUG", "true").lower() in ("1", "true", "yes")
    app.run(host=host, port=port, debug=debug)
