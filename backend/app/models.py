from datetime import datetime
from app import db
import bcrypt


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    def check_password(self, password):
        return bcrypt.checkpw(password.encode("utf-8"), self.password_hash.encode("utf-8"))

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "is_admin": self.is_admin,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# Approved = live for everyone. Pending = waiting admin. Rejected = not shown (or deleted).
PROPERTY_STATUS_APPROVED = "approved"
PROPERTY_STATUS_PENDING = "pending_approval"
PROPERTY_STATUS_REJECTED = "rejected"


class Property(db.Model):
    __tablename__ = "properties"
    id = db.Column(db.Integer, primary_key=True)
    seller_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    city = db.Column(db.String(80), nullable=True)
    area = db.Column(db.String(80), nullable=True)  # DHA, Bahria Town, Other
    price = db.Column(db.Integer, nullable=False)
    property_type = db.Column(db.String(40), nullable=False)  # house, apartment, villa
    listing_type = db.Column(db.String(20), nullable=False)  # sale, rent
    bedrooms = db.Column(db.Integer, nullable=False)
    bathrooms = db.Column(db.Integer, nullable=False)
    size_sqft = db.Column(db.Integer, nullable=False)
    amenities = db.Column(db.String(300), nullable=True)  # comma-separated or JSON
    status = db.Column(db.String(30), default=PROPERTY_STATUS_PENDING, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    seller = db.relationship("User", backref=db.backref("properties", lazy="dynamic"))

    def primary_image(self):
        """Get primary image URL or first image."""
        if self.images:
            primary = next((img for img in self.images if img.is_primary), None)
            if primary:
                return primary.image_url
            return self.images[0].image_url 
        return None

    def to_dict(self):
        return {
            "id": self.id,
            "seller_id": self.seller_id,
            "seller_name": self.seller.full_name if self.seller else None,
            "seller_phone": self.seller.phone if self.seller else None,
            "seller_email": self.seller.email if self.seller else None,
            "title": self.title,
            "location": self.location,
            "city": self.city,
            "area": self.area,
            "price": self.price,
            "property_type": self.property_type,
            "listing_type": self.listing_type,
            "bedrooms": self.bedrooms,
            "bathrooms": self.bathrooms,
            "size_sqft": self.size_sqft,
            "amenities": self.amenities.split(",") if self.amenities else [],
            "image_url": self.primary_image(),
            "images": [img.to_dict() for img in self.images],
            "primary_image": self.primary_image(),
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


def seed_admin_if_needed():
    if User.query.filter_by(email="admin@maharajabuilders.pk").first():
        return
    admin = User(
        full_name="Admin",
        email="admin@maharajabuilders.pk",
        phone="0300-0000000",
        is_admin=True,
    )
    admin.set_password("admin123")
    db.session.add(admin)
    db.session.commit()

class PropertyImage(db.Model):
    __tablename__ = "property_images"
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey("properties.id"), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    is_primary = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    property = db.relationship("Property", backref=db.backref("images", lazy=True, cascade="all, delete-orphan"))

    def to_dict(self):
        return {
            "id": self.id,
            "image_url": self.image_url,
            "is_primary": self.is_primary
        }