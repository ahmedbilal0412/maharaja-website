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
    Non-free properties (areas other than DHA/Bahria Town) should go back to
    admin approval after 30 days, even if previously approved.
    """
    if prop.area in ("DHA", "Bahria Town"):
        return False
    if prop.status != PROPERTY_STATUS_APPROVED:
        return False
    if not prop.created_at:
        return False
    if now is None:
        now = datetime.utcnow()
    return now - prop.created_at > timedelta(days=30)

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
    props = query.order_by(Property.created_at.desc()).all()

    # Auto-expire non-free properties after 30 days by moving them back to pending.
    now = datetime.utcnow()
    changed = False
    for prop in props:
        if _needs_reapproval(prop, now):
            prop.status = PROPERTY_STATUS_PENDING
            changed = True
    if changed:
        db.session.commit()
        props = [p for p in props if p.status == PROPERTY_STATUS_APPROVED]

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

    title = (data.get("title") or "").strip()
    location = (data.get("location") or "").strip()
    price = data.get("price")
    property_type = (data.get("property_type") or data.get("type") or "").strip()
    listing_type = (data.get("listing_type") or data.get("listing") or "").strip()
    bedrooms = data.get("bedrooms")
    bathrooms = data.get("bathrooms")
    size_sqft = data.get("size_sqft") or data.get("size")
    amenities = data.get("amenities")
    image_url = (data.get("image_url") or data.get("image") or "").strip()
    city = (data.get("city") or "").strip()

    if not title or not location or price is None:
        return jsonify({"message": "Title, location and price are required."}), 400
    if not property_type or not listing_type:
        return jsonify({"message": "Property type and listing type are required."}), 400
    if bedrooms is None or bathrooms is None or size_sqft is None:
        return jsonify({"message": "Bedrooms, bathrooms and size are required."}), 400

    area = _infer_area(location)
    if _location_is_free_listing(location):
        status = PROPERTY_STATUS_APPROVED
    else:
        status = PROPERTY_STATUS_PENDING

    if isinstance(amenities, list):
        amenities = ",".join(str(a) for a in amenities)
    elif amenities is None:
        amenities = ""

    images = data.get("images", [])  # Array of image URLs
    primary_image_index = data.get("primary_image_index", 0)

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
        amenities=amenities or None,
        status=status,
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
