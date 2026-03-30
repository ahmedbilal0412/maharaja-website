from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from app import db
from app.models import User
from datetime import datetime, timedelta
from itsdangerous import URLSafeTimedSerializer
import os

auth_bp = Blueprint("auth", __name__)

# Initialize serializer for generating secure tokens
serializer = URLSafeTimedSerializer(os.environ.get("SECRET_KEY", "dev-secret-key"))

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json() or {}
    full_name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone") or "").strip()
    password = data.get("password") or ""

    if not full_name or not email or not phone or not password:
        return jsonify({"message": "Full name, email, phone and password are required."}), 400
    if len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "An account with this email already exists."}), 409

    user = User(full_name=full_name, email=email, phone=phone)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Account created successfully.", "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"message": "Email and password are required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"message": "Invalid email or password."}), 401

    token = create_access_token(str(user.id), additional_claims={"is_admin": user.is_admin})
    return jsonify({"token": token, "user": user.to_dict()}), 200

# ==================== FORGOT PASSWORD ====================

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """Send password reset email with token."""
    data = request.get_json()
    email = data.get("email", "").strip()
    
    if not email:
        return jsonify({"message": "Email is required."}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user:
        # For security, don't reveal if email exists or not
        return jsonify({"message": "If your email is registered, you will receive a reset link."}), 200
    
    # Generate reset token (expires in 1 hour)
    token = serializer.dumps(email, salt='password-reset-salt')
    expiry = datetime.utcnow() + timedelta(hours=1)
    
    # Store token and expiry in database
    user.reset_token = token
    user.reset_token_expiry = expiry
    db.session.commit()
    
    # In production, send email here
    # For development, return the token in response (or log it)
    reset_link = f"{request.host_url}reset-password.html?token={token}"
    
    # For testing, return the token (remove in production)
    print(f"Password reset link: {reset_link}")
    
    # For production, you'd send an actual email
    # For now, return success with the link for testing
    return jsonify({
        "message": "Password reset email sent.",
        "reset_link": reset_link  # Remove this in production!
    }), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """Reset password using token."""
    data = request.get_json()
    token = data.get("token", "").strip()
    new_password = data.get("new_password", "").strip()
    
    if not token or not new_password:
        return jsonify({"message": "Token and new password are required."}), 400
    
    if len(new_password) < 6:
        return jsonify({"message": "Password must be at least 6 characters."}), 400
    
    # Find user by token
    user = User.query.filter_by(reset_token=token).first()
    
    if not user:
        return jsonify({"message": "Invalid or expired reset token."}), 400
    
    # Check if token is expired
    if user.reset_token_expiry and user.reset_token_expiry < datetime.utcnow():
        return jsonify({"message": "Reset token has expired. Please request a new one."}), 400
    
    # Verify token with serializer
    try:
        email = serializer.loads(token, salt='password-reset-salt', max_age=3600)
        if email != user.email:
            return jsonify({"message": "Invalid token."}), 400
    except Exception:
        return jsonify({"message": "Invalid or expired token."}), 400
    
    # Update password
    user.set_password(new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.session.commit()
    
    return jsonify({"message": "Password has been reset successfully."}), 200


# ==================== CHANGE PASSWORD ====================

@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    """Change password for logged-in user."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    current_password = data.get("current_password", "").strip()
    new_password = data.get("new_password", "").strip()
    confirm_password = data.get("confirm_password", "").strip()
    
    if not current_password or not new_password:
        return jsonify({"message": "Current password and new password are required."}), 400
    
    if new_password != confirm_password:
        return jsonify({"message": "New passwords do not match."}), 400
    
    if len(new_password) < 6:
        return jsonify({"message": "Password must be at least 6 characters."}), 400
    
    # Get user
    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError):
        return jsonify({"message": "Invalid user."}), 400
    
    user = User.query.get(user_id_int)
    if not user:
        return jsonify({"message": "User not found."}), 404
    
    # Verify current password
    if not user.check_password(current_password):
        return jsonify({"message": "Current password is incorrect."}), 401
    
    # Update password
    user.set_password(new_password)
    db.session.commit()
    
    return jsonify({"message": "Password changed successfully."}), 200