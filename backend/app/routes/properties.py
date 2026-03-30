from pathlib import Path
from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Property, User, PROPERTY_STATUS_APPROVED, PROPERTY_STATUS_PENDING, PropertyImage
import os
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta

properties_bp = Blueprint("properties", __name__)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # routes folder → app → backend
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads", "properties")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

# Premium pricing
PREMIUM_PRICE = 500  # PKR per month

def delete_property_images(property_obj):
    """Delete all image files for a property."""
    try:
        # Get uploads directory
        current_file = Path(__file__).resolve()
        backend_dir = current_file.parent.parent  # routes → app
        uploads_dir = backend_dir / "uploads" / "properties"
        
        deleted_files = []
        for image in property_obj.images:
            image_url = image.image_url
            
            # Extract filename from various URL formats
            if "/" in image_url:
                # Get the last part after the last slash
                filename = image_url.split("/")[-1]
            else:
                filename = image_url
            
            # Try to delete the file
            file_path = uploads_dir / filename
            if file_path.exists():
                os.remove(file_path)
                deleted_files.append(filename)
                print(f"Deleted: {filename}")
        
        print(f"DEBUG: Deleted {len(deleted_files)} image files for property {property_obj.id}")
        return deleted_files
        
    except Exception as e:
        print(f"ERROR deleting property images: {str(e)}")
        return []

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def _location_is_free_listing(location):
    if not location:
        return False
    loc = (location or "").lower()
    return "dha" in loc or "bahria town" in loc or "bahria" in loc

def _infer_area(location):
    if not location:
        return "Other"
    loc = location.lower()
    if "dha" in loc:
        return "DHA"
    if "bahria" in loc:
        return "Bahria Town"
    return "Other"

def _needs_reapproval(prop: Property, now=None) -> bool:
    """
    Properties need reapproval if:
    1. They are in non-free areas (other than DHA/Bahria Town) AND created more than 30 days ago, OR
    2. Premium has expired (for both free and non-free areas)
    """
    if now is None:
        now = datetime.utcnow()
    
    if prop.status != PROPERTY_STATUS_APPROVED:
        return False
    
    # Check if premium has expired
    if prop.is_premium and prop.premium_expiry:
        if prop.premium_expiry < now:
            return True  # Premium expired, needs reapproval
    
    # Check area-based expiry (only for non-DHA/Bahria)
    if prop.area not in ("DHA", "Bahria Town"):
        if prop.created_at and now - prop.created_at > timedelta(days=30):
            return True  # Non-free area older than 30 days
    
    return False


@properties_bp.route("", methods=["GET"])
def list_properties():
    """Public list: only approved properties. Optional filters: city, area, listing_type."""
    query = Property.query.filter_by(status=PROPERTY_STATUS_APPROVED)
    city = request.args.get("city", "").strip()
    area = request.args.get("area", "").strip()
    listing_type = request.args.get("listing_type", "").strip()
    
    if city:
        query = query.filter(Property.city.ilike(f"%{city}%"))
    if area:
        query = query.filter(Property.area.ilike(f"%{area}%"))
    if listing_type:
        query = query.filter(Property.listing_type == listing_type)
    
    # Get all properties first
    props = query.all()

    # Auto-expire non-free properties after 30 days by moving them back to pending.
    now = datetime.utcnow()
    changed = False
    for prop in props:
        if _needs_reapproval(prop, now):
            prop.status = PROPERTY_STATUS_PENDING
            changed = True
    if changed:
        db.session.commit()
        # Refresh the list after changes
        props = [p for p in props if p.status == PROPERTY_STATUS_APPROVED]
    
    # Sort: premium active properties first, then by created date
    def sort_key(prop):
        # Check if premium is active (paid and not expired)
        is_premium_active = prop.is_premium and prop.premium_payment_status == "paid"
        if is_premium_active and prop.premium_expiry and prop.premium_expiry > now:
            premium_score = 0  # Premium properties come first
        else:
            premium_score = 1  # Non-premium come after
        # Then sort by created date (newest first)
        date_score = -prop.created_at.timestamp() if prop.created_at else 0
        return (premium_score, date_score)
    
    props.sort(key=sort_key)

    return jsonify({"properties": [p.to_dict() for p in props]}), 200


@properties_bp.route("/my", methods=["GET"])
@jwt_required()
def my_properties():
    """List current user's properties (any status)."""
    user_id = get_jwt_identity()
    props = Property.query.filter_by(seller_id=user_id).order_by(Property.created_at.desc()).all()
    return jsonify({"properties": [p.to_dict() for p in props]}), 200


@properties_bp.route("/<int:prop_id>", methods=["GET"])
@jwt_required(optional=True)
def get_property(prop_id):
    """Get single property."""
    user_id = get_jwt_identity()
    prop = Property.query.get_or_404(prop_id)

    # Auto-expire if needed
    now = datetime.utcnow()
    if _needs_reapproval(prop, now):
        prop.status = PROPERTY_STATUS_PENDING
        db.session.commit()

    # Check if user can view this property
    can_access = _can_access_property(prop, user_id)
    if not can_access:
        return jsonify({"message": "Property not found."}), 404
    
    return jsonify(prop.to_dict()), 200


def _can_access_property(prop, user_id):
    """Check if user can access property."""
    # Approved properties: anyone can access
    if prop.status == PROPERTY_STATUS_APPROVED:
        return True
    
    # No user logged in
    if not user_id:
        return False
    
    # Get user
    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError):
        return False
    
    user = User.query.get(user_id_int)
    if not user:
        return False
    
    # Owner or admin can view pending properties
    return prop.seller_id == user_id_int or user.is_admin


@properties_bp.route("", methods=["POST"])
@jwt_required()
def create_property():
    """Create property. DHA/Bahria Town -> approved; Other -> pending_approval (after payment step on frontend)."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    print("DEBUG: Received data:", data)  

    # Basic required fields
    title = (data.get("title") or "").strip()
    location = (data.get("location") or "").strip()
    price = data.get("price")
    property_type = (data.get("property_type") or data.get("type") or "").strip()
    listing_type = (data.get("listing_type") or data.get("listing") or "").strip()
    bedrooms = data.get("bedrooms")
    bathrooms = data.get("bathrooms")
    size_sqft = data.get("size_sqft") or data.get("size")
    amenities = data.get("amenities")
    city = (data.get("city") or "").strip()
    
    # New optional fields
    description = data.get("description", "").strip()
    parking = data.get("parking", False)
    furnished = data.get("furnished", "")
    total_floors = data.get("total_floors")
    electricity_backup = data.get("electricity_backup", False)
    year_built = data.get("year_built")
    
    # Premium field
    is_premium = data.get("is_premium", False)

    # Validation
    if not title or not location or price is None:
        return jsonify({"message": "Title, location and price are required."}), 400
    if not property_type or not listing_type:
        return jsonify({"message": "Property type and listing type are required."}), 400
    if bedrooms is None or bathrooms is None or size_sqft is None:
        return jsonify({"message": "Bedrooms, bathrooms and size are required."}), 400

    area = _infer_area(location)
    if is_premium:
        status = PROPERTY_STATUS_PENDING
    elif _location_is_free_listing(location):
        status = PROPERTY_STATUS_APPROVED
    else:
        status = PROPERTY_STATUS_PENDING

    # Handle amenities (convert list to comma-separated string)
    if isinstance(amenities, list):
        amenities_str = ",".join(str(a) for a in amenities)
    elif amenities is None:
        amenities_str = ""
    else:
        amenities_str = str(amenities)

    # Handle total_floors and year_built (convert to int if provided)
    if total_floors is not None:
        try:
            total_floors = int(total_floors)
        except (TypeError, ValueError):
            total_floors = None
    
    if year_built is not None:
        try:
            year_built = int(year_built)
        except (TypeError, ValueError):
            year_built = None

    images = data.get("images", [])  # Array of image URLs
    primary_image_index = data.get("primary_image_index", 0)

    # Create property with all fields
    prop = Property(
        seller_id=user_id,
        title=title,
        location=location,
        city=city or None,
        area=area,
        price=int(price),
        property_type=property_type,
        listing_type=listing_type,
        bedrooms=int(bedrooms),
        bathrooms=int(bathrooms),
        size_sqft=int(size_sqft),
        amenities=amenities_str or None,
        status=status,
        # New fields
        description=description or None,
        parking=parking,
        furnished=furnished if furnished else None,
        total_floors=total_floors,
        electricity_backup=electricity_backup,
        year_built=year_built,
        # Premium fields
        is_premium=is_premium,
        premium_payment_status="unpaid"  # Default to unpaid, payment required to activate
    )
    
    db.session.add(prop)
    db.session.flush()

    # Add images
    for i, image_url in enumerate(images):
        is_primary = (i == primary_image_index)
        prop_image = PropertyImage(
            property_id=prop.id,
            image_url=image_url,
            is_primary=is_primary
        )
        db.session.add(prop_image)

    db.session.commit()
    print("DEBUG: Property images:", [img.to_dict() for img in prop.images])
    return jsonify({"message": "Property submitted.", "property": prop.to_dict()}), 201


@properties_bp.route("/<int:prop_id>", methods=["DELETE"])
@jwt_required()
def delete_property(prop_id):
    """Seller can delete own property."""
    user_id = int(get_jwt_identity())
    prop = Property.query.get_or_404(prop_id)

    can_access = _can_access_property(prop, user_id)
    if not can_access:
        return jsonify({"message": "Not allowed to delete this property."}), 403
        
    deleted_files = delete_property_images(prop)

    db.session.delete(prop)
    db.session.commit()
    return jsonify({"message": "Property deleted.", "deleted_images": len(deleted_files)}), 200


@properties_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_images():
    """Upload multiple images and return URLs."""
    if 'images' not in request.files:
        return jsonify({"message": "No images provided"}), 400
    
    files = request.files.getlist('images')
    if not files or files[0].filename == '':
        return jsonify({"message": "No selected files"}), 400
    
    # Create uploads directory if it doesn't exist
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    image_urls = []
    for i, file in enumerate(files):
        if file and allowed_file(file.filename):
            # Generate unique filename
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')
            original_name = secure_filename(file.filename)
            unique_filename = f"{timestamp}_{original_name}"
            filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
            
            file.save(filepath)
            # Return URL path (your Flask app will need to serve these)
            image_urls.append(f"/api/properties/uploads/properties/{unique_filename}")
        else:
            return jsonify({"message": f"File {file.filename} has invalid extension"}), 400
    
    return jsonify({"image_urls": image_urls}), 200


@properties_bp.route("/uploads/<path:filename>", methods=["GET"])
def serve_uploaded_image(filename):
    """Serve uploaded images."""
    print("test")
    try:
        # Serve from uploads folder
        uploads_dir = BASE_DIR + "/" + "uploads"
        return send_from_directory(str(uploads_dir), filename)
    except FileNotFoundError:
        return jsonify({"message": "Image not found"}), 404