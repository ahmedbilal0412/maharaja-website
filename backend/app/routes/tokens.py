from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, TokenPurchase
from datetime import datetime
import os
from werkzeug.utils import secure_filename

tokens_bp = Blueprint("tokens", __name__)

# Token pricing structure
TOKEN_PACKS = {
    1: {"tokens": 1, "price_per_token": 1000, "total": 1000},
    5: {"tokens": 5, "price_per_token": 799, "total": 3995},
    10: {"tokens": 10, "price_per_token": 699, "total": 6990},
    25: {"tokens": 25, "price_per_token": 599, "total": 14975},
    50: {"tokens": 50, "price_per_token": 499, "total": 24950},
}

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "pdf"}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@tokens_bp.route("/packs", methods=["GET"])
@jwt_required()
def get_token_packs():
    """Get available token packs for purchase."""
    return jsonify({"packs": TOKEN_PACKS}), 200

@tokens_bp.route("/balance", methods=["GET"])
@jwt_required()
def get_token_balance():
    """Get current user's token balance."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    return jsonify({"balance": user.premium_tokens}), 200

@tokens_bp.route("/upload-receipt", methods=["POST"])
@jwt_required()
def upload_receipt():
    """Upload payment receipt for token purchase."""
    if 'receipt' not in request.files:
        return jsonify({"message": "No receipt image provided"}), 400
    
    file = request.files['receipt']
    if file.filename == '':
        return jsonify({"message": "No selected file"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"message": f"File type not allowed. Allowed: {ALLOWED_EXTENSIONS}"}), 400
    
    # Create receipts directory if it doesn't exist
    receipt_folder = os.path.join(BASE_DIR, "uploads", "token_receipts")
    os.makedirs(receipt_folder, exist_ok=True)
    
    # Generate unique filename
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')
    original_name = secure_filename(file.filename)
    unique_filename = f"token_receipt_{timestamp}_{original_name}"
    filepath = os.path.join(receipt_folder, unique_filename)
    
    file.save(filepath)
    
    # Return URL path
    receipt_url = f"/api/tokens/uploads/token_receipts/{unique_filename}"
    
    return jsonify({"receipt_url": receipt_url}), 200

@tokens_bp.route("/purchase", methods=["POST"])
@jwt_required()
def purchase_tokens():
    """Submit token purchase request."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    token_pack = data.get("token_pack")
    receipt_image_url = data.get("receipt_image_url", "").strip()
    
    if not token_pack or token_pack not in TOKEN_PACKS:
        return jsonify({"message": "Invalid token pack selected"}), 400
    
    if not receipt_image_url:
        return jsonify({"message": "Receipt image is required"}), 400
    
    pack = TOKEN_PACKS[token_pack]
    
    purchase = TokenPurchase(
        user_id=user_id,
        token_count=pack["tokens"],
        price_per_token=pack["price_per_token"],
        total_price=pack["total"],
        receipt_image_url=receipt_image_url,
        status="pending"
    )
    
    db.session.add(purchase)
    db.session.commit()
    
    return jsonify({
        "message": "Token purchase request submitted for approval.",
        "purchase": purchase.to_dict()
    }), 201

@tokens_bp.route("/uploads/token_receipts/<path:filename>", methods=["GET"])
def serve_receipt(filename):
    """Serve uploaded receipt images."""
    from flask import send_from_directory
    import os
    
    receipt_folder = os.path.join(BASE_DIR, "uploads", "token_receipts")
    
    return send_from_directory(receipt_folder, filename)