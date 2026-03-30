from app import create_app, db
from sqlalchemy import inspect

app = create_app()
with app.app_context():
    # Clear any cached table reflection
    db.metadata.clear()
    
    # Check if the table is accessible
    inspector = inspect(db.engine)
    print("Tables:", inspector.get_table_names())
    print("Users columns:", [col['name'] for col in inspector.get_columns('users')])
    
    # Try to query admin
    from app.models import User
    admin = User.query.filter_by(email="admin@maharajabuilders.pk").first()
    print("Admin found:", admin.full_name if admin else "Not found")