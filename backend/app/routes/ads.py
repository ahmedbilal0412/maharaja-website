from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, timedelta
import os
from werkzeug.utils import secure_filename
from pathlib import Path

ads_bp = Blueprint("ads", __name__)

# Use same upload folder as properties
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads", "ads")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

# Duration pricing (in PKR)
DURATION_PRICES = {
    "1week": 500,
    "2weeks": 900,
    "1month": 1500
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def _require_admin():
    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    if not claims.get("is_admin"):
        return jsonify({"message": "Admin access required."}), 403
    return None

@ads_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_ad_image():
    """Upload ad image and return URL."""
    if 'image' not in request.files:
        return jsonify({"message": "No image provided"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"message": "No selected file"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"message": f"File type not allowed. Allowed: {ALLOWED_EXTENSIONS}"}), 400
    
    # Create uploads directory if it doesn't exist
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    # Generate unique filename
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')
    original_name = secure_filename(file.filename)
    unique_filename = f"ad_{timestamp}_{original_name}"
    filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
    
    file.save(filepath)
    
    # Return URL path
    image_url = f"/api/ads/uploads/{unique_filename}"
    
    return jsonify({"image_url": image_url}), 200

@ads_bp.route("/register", methods=["POST"])
@jwt_required()
def register_ad():
    """Submit ad for approval."""
    from app import db
    from app.models import Ad
    
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    image_url = data.get("image_url", "").strip()
    link_url = data.get("link_url", "").strip()
    duration = data.get("duration", "").strip()
    
    if not image_url:
        return jsonify({"message": "Ad image is required."}), 400
    
    if duration not in DURATION_PRICES:
        return jsonify({"message": "Invalid duration. Choose: 1week, 2weeks, 1month"}), 400
    
    price = DURATION_PRICES[duration]
    
    ad = Ad(
        user_id=user_id,
        image_url=image_url,
        link_url=link_url or None,
        duration=duration,
        price=price,
        status="pending",
        payment_status="unpaid"
    )
    
    db.session.add(ad)
    db.session.commit()
    
    return jsonify({
        "message": "Ad submitted for approval.",
        "ad": ad.to_dict(),
        "payment_amount": price
    }), 201

@ads_bp.route("/my", methods=["GET"])
@jwt_required()
def my_ads():
    """List current user's ads."""
    from app import db
    from app.models import Ad
    
    user_id = get_jwt_identity()
    ads = Ad.query.filter_by(user_id=user_id).order_by(Ad.created_at.desc()).all()
    return jsonify({"ads": [ad.to_dict() for ad in ads]}), 200

@ads_bp.route("/pay/<int:ad_id>", methods=["POST"])
@jwt_required()
def mark_paid(ad_id):
    """Simulate payment - mark ad as paid."""
    from app import db
    from app.models import Ad
    
    user_id = get_jwt_identity()
    ad = Ad.query.get_or_404(ad_id)
    
    if ad.user_id != int(user_id):
        return jsonify({"message": "Not your ad."}), 403
    
    if ad.payment_status == "paid":
        return jsonify({"message": "Ad already paid."}), 400
    
    ad.payment_status = "paid"
    db.session.commit()
    
    return jsonify({"message": "Payment recorded. Awaiting admin approval.", "ad": ad.to_dict()}), 200

@ads_bp.route("/current", methods=["GET"])
def get_current_ad():
    """Get currently active ad for homepage."""
    from app import db
    from app.models import Ad
    
    now = datetime.utcnow()
    ad = Ad.query.filter(
        Ad.status == "approved",
        Ad.payment_status == "paid",
        Ad.start_date <= now,
        Ad.end_date >= now
    ).order_by(Ad.created_at.desc()).first()
    
    if ad:
        return jsonify({"ad": ad.to_dict()}), 200
    return jsonify({"ad": None}), 200

@ads_bp.route("/uploads/<path:filename>", methods=["GET"])
def serve_ad_image(filename):
    """Serve uploaded ad images."""
    from flask import send_from_directory
    uploads_dir = os.path.join(BASE_DIR, "uploads", "ads")
    return send_from_directory(uploads_dir, filename)