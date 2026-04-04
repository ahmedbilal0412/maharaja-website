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
    reset_token = db.Column(db.String(200), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)
    
    # Premium tokens balance
    premium_tokens = db.Column(db.Integer, default=0, nullable=False)

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
            "premium_tokens": self.premium_tokens,
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
    property_type = db.Column(db.String(40), nullable=False)  # house, apartment, villa, plot
    
    # New fields
    description = db.Column(db.Text, nullable=True)  # Detailed property description
    parking = db.Column(db.Boolean, default=False)  # Whether parking is available
    furnished = db.Column(db.String(20), nullable=True)  # 'unfurnished', 'semi-furnished', 'fully-furnished'
    total_floors = db.Column(db.Integer, nullable=True)  # Total floors in building/property
    electricity_backup = db.Column(db.Boolean, default=False)  # Whether backup generator/solar is available
    year_built = db.Column(db.Integer, nullable=True)  # Year the property was built
    
    # Premium fields
    is_premium = db.Column(db.Boolean, default=False)  # Whether property is premium
    premium_expiry = db.Column(db.DateTime, nullable=True)  # When premium subscription expires
    
    # Existing fields
    listing_type = db.Column(db.String(20), nullable=False)  # sale, rent
    bedrooms = db.Column(db.Integer, nullable=False)
    bathrooms = db.Column(db.Integer, nullable=False)
    size_sqft = db.Column(db.Integer, nullable=False)
    amenities = db.Column(db.String(300), nullable=True)  # comma-separated or JSON
    status = db.Column(db.String(30), default=PROPERTY_STATUS_PENDING, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    receipt_image_url = db.Column(db.String(500), nullable=True)  # Payment receipt image

    seller = db.relationship("User", backref=db.backref("properties", lazy="dynamic"))

    def primary_image(self):
        """Get primary image URL or first image."""
        if self.images:
            primary = next((img for img in self.images if img.is_primary), None)
            if primary:
                return primary.image_url
            return self.images[0].image_url 
        return None

    def is_premium_active(self):
        """Check if premium subscription is currently active."""
        if not self.is_premium:
            return False
        if self.premium_expiry and self.premium_expiry < datetime.utcnow():
            return False
        return True

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
            "description": self.description,
            "parking": self.parking,
            "furnished": self.furnished,
            "total_floors": self.total_floors,
            "electricity_backup": self.electricity_backup,
            "year_built": self.year_built,
            "listing_type": self.listing_type,
            "bedrooms": self.bedrooms,
            "bathrooms": self.bathrooms,
            "size_sqft": self.size_sqft,
            "amenities": self.amenities.split(",") if self.amenities else [],
            "image_url": self.primary_image(),
            "images": [img.to_dict() for img in self.images],
            "primary_image": self.primary_image(),
            "status": self.status,
            "is_premium": self.is_premium,
            "is_premium_active": self.is_premium_active(),
            "premium_expiry": self.premium_expiry.isoformat() if self.premium_expiry else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "receipt_image_url": self.receipt_image_url,
        }


def seed_admin_if_needed():
    if User.query.filter_by(email="admin@maharajabuilders.pk").first():
        return
    admin = User(
        full_name="Admin",
        email="admin@maharajabuilders.pk",
        phone="0300-0000000",
        is_admin=True,
        premium_tokens=0,
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


class Ad(db.Model):
    __tablename__ = "ads"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    link_url = db.Column(db.String(500), nullable=True)  # Optional external link
    duration = db.Column(db.String(20), nullable=False)  # '1week', '2weeks', '1month'
    price = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(30), default="pending", nullable=False)  # pending, approved, rejected, expired
    payment_status = db.Column(db.String(30), default="unpaid", nullable=False)  # unpaid, paid
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    receipt_image_url = db.Column(db.String(500), nullable=True)  # Payment receipt image
    
    user = db.relationship("User", backref=db.backref("ads", lazy="dynamic"))
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else None,
            "image_url": self.image_url,
            "link_url": self.link_url,
            "duration": self.duration,
            "price": self.price,
            "status": self.status,
            "payment_status": self.payment_status,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "receipt_image_url": self.receipt_image_url,
        }


class TokenPurchase(db.Model):
    __tablename__ = "token_purchases"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    token_count = db.Column(db.Integer, nullable=False)  # Number of tokens purchased
    price_per_token = db.Column(db.Integer, nullable=False)  # Price per token in PKR
    total_price = db.Column(db.Integer, nullable=False)  # Total price in PKR
    receipt_image_url = db.Column(db.String(500), nullable=False)  # Payment receipt image
    status = db.Column(db.String(30), default="pending", nullable=False)  # pending, approved, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    approved_at = db.Column(db.DateTime, nullable=True)
    
    user = db.relationship("User", foreign_keys=[user_id], backref=db.backref("token_purchases", lazy="dynamic"))
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else None,
            "user_email": self.user.email if self.user else None,
            "token_count": self.token_count,
            "price_per_token": self.price_per_token,
            "total_price": self.total_price,
            "receipt_image_url": self.receipt_image_url,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "approved_at": self.approved_at.isoformat() if self.approved_at else None,
        }