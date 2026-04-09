from flask import Blueprint, request, jsonify, current_app
from app.utils.email_service import send_welcome_email, send_login_notification
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from app import db, mail
from app.models import User
from datetime import datetime, timedelta
from itsdangerous import URLSafeTimedSerializer
from flask_mail import Message
import os

auth_bp = Blueprint("auth", __name__)


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

    send_welcome_email(user)

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
    send_login_notification(user, request.remote_addr)
    return jsonify({"token": token, "user": user.to_dict()}), 200


# ==================== FORGOT PASSWORD ====================

def send_reset_email(to_email, reset_link):
    """Send password reset email using Flask-Mail."""
    from flask_mail import Message
    from app import mail
    
    try:
        msg = Message(
            subject='Password Reset Request - Maharaja Builders',
            recipients=[to_email],
            html=f'''
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset</title>
                <style>
                    body {{
                        font-family: 'Poppins', Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 0;
                    }}
                    .container {{
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background: #f9f9f9;
                        border-radius: 10px;
                    }}
                    .header {{
                        text-align: center;
                        padding: 20px 0;
                        border-bottom: 3px solid #d4af37;
                    }}
                    .logo {{
                        max-width: 150px;
                    }}
                    .content {{
                        padding: 30px 20px;
                    }}
                    .button {{
                        display: inline-block;
                        padding: 12px 30px;
                        background: #0b3d2e;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        margin: 20px 0;
                        font-weight: 600;
                    }}
                    .button:hover {{
                        background: #145f47;
                    }}
                    .footer {{
                        text-align: center;
                        padding: 20px;
                        font-size: 12px;
                        color: #666;
                        border-top: 1px solid #ddd;
                    }}
                    .link-text {{
                        word-break: break-all;
                        background: #f0f0f0;
                        padding: 10px;
                        border-radius: 5px;
                        font-size: 12px;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="https://maharajabuilders.pk/img/maharaja.png" alt="Maharaja Builders" class="logo" style="max-width: 150px;">
                        <h2 style="color: #0b3d2e;">Password Reset Request</h2>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>We received a request to reset your password for your Maharaja Builders account.</p>
                        <p>Click the button below to reset your password:</p>
                        <div style="text-align: center;">
                            <a href="{reset_link}" class="button">Reset Password</a>
                        </div>
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <p class="link-text">{reset_link}</p>
                        <p>This link will expire in <strong>1 hour</strong>.</p>
                        <p>If you didn't request this, you can safely ignore this email. Your password will not be changed.</p>
                        <hr style="margin: 20px 0;">
                        <p style="font-size: 12px; color: #999;">This is an automated message from Maharaja Builders. Please do not reply to this email.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2025 Maharaja Builders & Realtors. All rights reserved.</p>
                        <p>Pakistan's most trusted real estate partner</p>
                        <p><a href="https://maharajabuilders.pk" style="color: #0b3d2e;">Visit our website</a></p>
                    </div>
                </div>
            </body>
            </html>
            '''
        )
        mail.send(msg)
        print(f"Password reset email sent to {to_email}")
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False


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
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    token = serializer.dumps(email, salt='password-reset-salt')
    expiry = datetime.utcnow() + timedelta(hours=1)
    
    # Store token and expiry in database
    user.reset_token = token
    user.reset_token_expiry = expiry
    db.session.commit()
    
    # Build reset link
    frontend_url = os.environ.get("FRONTEND_URL", "https://maharajabuilders.pk")
    reset_link = f"{frontend_url}/reset-password.html?token={token}"
    
    # Send email
    email_sent = send_reset_email(email, reset_link)
    
    if email_sent:
        return jsonify({"message": "Password reset email sent. Please check your inbox."}), 200
    else:
        return jsonify({"message": "Unable to send reset email. Please try again later."}), 500


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
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
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