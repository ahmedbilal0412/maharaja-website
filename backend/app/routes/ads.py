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
    """Submit ad for approval with custom dates."""
    from app import db
    from app.models import Ad
    from datetime import datetime
    
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    image_url = data.get("image_url", "").strip()
    link_url = data.get("link_url", "").strip()
    receipt_image_url = data.get("receipt_image_url", "").strip()  
    start_date_str = data.get("start_date", "").strip()
    end_date_str = data.get("end_date", "").strip()
    duration = data.get("duration", "").strip()
    price = data.get("price", 0)
    
    if not image_url:
        return jsonify({"message": "Ad image is required."}), 400

    if not receipt_image_url:  # ADD THIS VALIDATION
        return jsonify({"message": "Payment receipt is required."}), 400
    
    # Parse dates
    try:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
    except ValueError:
        return jsonify({"message": "Invalid date format. Use YYYY-MM-DD."}), 400
    
    # Validate dates
    now = datetime.utcnow()
    if start_date.date() < now.date():
        return jsonify({"message": "Start date cannot be in the past."}), 400
    
    if end_date <= start_date:
        return jsonify({"message": "End date must be after start date."}), 400
    
    # Calculate duration in days
    duration_days = (end_date - start_date).days
    
    if duration_days < 7:
        return jsonify({"message": "Minimum duration is 7 days (1 week)."}), 400
    
    # Check for date conflicts with existing approved ads
    overlapping = Ad.query.filter(
        Ad.status == "approved",
        Ad.payment_status == "paid",
        Ad.start_date <= end_date,
        Ad.end_date >= start_date
    ).first()
    
    if overlapping:
        return jsonify({
            "message": f"Date conflict! There is already an ad scheduled from {overlapping.start_date.strftime('%b %d, %Y')} to {overlapping.end_date.strftime('%b %d, %Y')}. Please choose different dates."
        }), 400
    
    # Use provided price or calculate from duration
    if price <= 0:
        if duration_days == 7:
            price = 8000
        elif duration_days == 14:
            price = 15000
        elif duration_days == 30:
            price = 28000
        else:
            price = int(round((8000 / 7) * duration_days))
    
    # Store duration string for compatibility
    if duration_days == 7:
        duration_str = "1week"
    elif duration_days == 14:
        duration_str = "2weeks"
    elif duration_days == 30:
        duration_str = "1month"
    else:
        duration_str = f"{duration_days}days"
    
    ad = Ad(
        user_id=user_id,
        image_url=image_url,
        link_url=link_url or None,
        receipt_image_url=receipt_image_url,  
        duration=duration_str,
        price=price,
        start_date=start_date,
        end_date=end_date,
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

@ads_bp.route("/check-availability", methods=["POST"])
@jwt_required()
def check_ad_availability():
    """Check if the selected date range conflicts with existing ads."""
    from app import db
    from app.models import Ad
    from datetime import datetime
    
    data = request.get_json() or {}
    start_date_str = data.get("start_date", "").strip()
    end_date_str = data.get("end_date", "").strip()
    
    if not start_date_str or not end_date_str:
        return jsonify({"available": True, "message": "No dates provided"}), 200
    
    try:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
    except ValueError:
        return jsonify({"available": False, "message": "Invalid date format"}), 400
    
    # Check for overlapping approved and paid ads
    overlapping = Ad.query.filter(
        Ad.status == "approved",
        Ad.payment_status == "paid",
        Ad.start_date <= end_date,
        Ad.end_date >= start_date
    ).first()
    
    if overlapping:
        return jsonify({
            "available": False,
            "message": f"There is already an ad scheduled from {overlapping.start_date.strftime('%b %d, %Y')} to {overlapping.end_date.strftime('%b %d, %Y')}"
        }), 200
    
    return jsonify({"available": True, "message": "Dates are available"}), 200


@ads_bp.route("/upload-receipt", methods=["POST"])
@jwt_required()
def upload_receipt():
    """Upload payment receipt image."""
    if 'receipt' not in request.files:
        return jsonify({"message": "No receipt image provided"}), 400
    
    file = request.files['receipt']
    if file.filename == '':
        return jsonify({"message": "No selected file"}), 400
    
    # Use same allowed extensions
    allowed_extensions = {"png", "jpg", "jpeg", "gif", "pdf"}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({"message": f"File type not allowed. Allowed: {allowed_extensions}"}), 400
    
    # Create receipts directory
    receipt_folder = os.path.join(BASE_DIR, "uploads", "receipts")
    os.makedirs(receipt_folder, exist_ok=True)
    
    # Generate unique filename
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')
    original_name = secure_filename(file.filename)
    unique_filename = f"receipt_{timestamp}_{original_name}"
    filepath = os.path.join(receipt_folder, unique_filename)
    
    file.save(filepath)
    
    # Return URL path
    receipt_url = f"/api/ads/uploads/receipts/{unique_filename}"
    
    return jsonify({"receipt_url": receipt_url}), 200

@ads_bp.route("/uploads/receipts/<path:filename>", methods=["GET"])
def serve_receipt(filename):
    """Serve uploaded receipt images."""
    from flask import send_from_directory
    import os
    
    receipt_folder = os.path.join(BASE_DIR, "uploads", "receipts")
    
    return send_from_directory(receipt_folder, filename)