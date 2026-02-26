from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app import db
from app.models import Property, User, PROPERTY_STATUS_APPROVED, PROPERTY_STATUS_PENDING
from pathlib import Path

admin_bp = Blueprint("admin", __name__)


def _require_admin():
    claims = get_jwt()
    if not claims.get("is_admin"):
        return jsonify({"message": "Admin access required."}), 403
    return None

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

@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def list_users():
    err = _require_admin()
    if err:
        return err
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({"users": [u.to_dict() for u in users]}), 200


@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
def stats():
    err = _require_admin()
    if err:
        return err
    total_users = User.query.count()
    total_listings = Property.query.count()
    pending = Property.query.filter_by(status=PROPERTY_STATUS_PENDING).count()
    approved = Property.query.filter_by(status=PROPERTY_STATUS_APPROVED).count()
    return jsonify({
        "total_users": total_users,
        "total_listings": total_listings,
        "pending_approvals": pending,
        "approved_listings": approved,
    }), 200


@admin_bp.route("/properties", methods=["GET"])
@jwt_required()
def list_all_properties():
    err = _require_admin()
    if err:
        return err
    status = request.args.get("status", "").strip().lower()
    query = Property.query.order_by(Property.created_at.desc())
    if status == "pending" or status == "pending_approval":
        query = query.filter_by(status=PROPERTY_STATUS_PENDING)
    elif status == "approved":
        query = query.filter_by(status=PROPERTY_STATUS_APPROVED)
    elif status == "rejected":
        query = query.filter_by(status="rejected")
    props = query.all()
    return jsonify({"properties": [p.to_dict() for p in props]}), 200


@admin_bp.route("/properties/pending", methods=["GET"])
@jwt_required()
def list_pending():
    err = _require_admin()
    if err:
        return err
    props = Property.query.filter_by(status=PROPERTY_STATUS_PENDING).order_by(Property.created_at.desc()).all()
    return jsonify({"properties": [p.to_dict() for p in props]}), 200


@admin_bp.route("/properties/<int:prop_id>/approve", methods=["POST"])
@jwt_required()
def approve(prop_id):
    err = _require_admin()
    if err:
        return err
    prop = Property.query.get_or_404(prop_id)
    if prop.status != PROPERTY_STATUS_PENDING:
        return jsonify({"message": "Property is not pending approval."}), 400
    prop.status = PROPERTY_STATUS_APPROVED
    db.session.commit()
    return jsonify({"message": "Property approved.", "property": prop.to_dict()}), 200


@admin_bp.route("/properties/<int:prop_id>/reject", methods=["POST"])
@jwt_required()
def reject(prop_id):
    err = _require_admin()
    if err:
        return err
    prop = Property.query.get_or_404(prop_id)
    if prop.status != PROPERTY_STATUS_PENDING:
        return jsonify({"message": "Property is not pending approval."}), 400
    
    deleted_files = delete_property_images(prop)
    db.session.delete(prop)
    db.session.commit()
    return jsonify({"message": "Property rejected and removed.", "deleted files": len(deleted_files)}), 200

@admin_bp.route("/ads", methods=["GET"])
@jwt_required()
def list_all_ads():
    """Admin: List all ads with optional status filter."""
    from app.models import Ad
    
    err = _require_admin()
    if err:
        return err
    
    status = request.args.get("status", "").strip().lower()
    query = Ad.query.order_by(Ad.created_at.desc())
    
    if status in ["pending", "approved", "rejected", "expired"]:
        query = query.filter_by(status=status)
    
    ads = query.all()
    return jsonify({"ads": [ad.to_dict() for ad in ads]}), 200

@admin_bp.route("/ads/<int:ad_id>/approve", methods=["POST"])
@jwt_required()
def approve_ad(ad_id):
    """Admin: Approve ad and set start/end dates."""
    from app import db
    from app.models import Ad
    from datetime import datetime, timedelta
    
    err = _require_admin()
    if err:
        return err
    
    ad = Ad.query.get_or_404(ad_id)
    
    if ad.payment_status != "paid":
        return jsonify({"message": "Ad payment not completed."}), 400
    
    if ad.status != "pending":
        return jsonify({"message": "Ad is not pending approval."}), 400
    
    # Set start and end dates based on duration
    now = datetime.utcnow()
    ad.start_date = now
    
    if ad.duration == "1week":
        ad.end_date = now + timedelta(days=7)
    elif ad.duration == "2weeks":
        ad.end_date = now + timedelta(days=14)
    elif ad.duration == "1month":
        ad.end_date = now + timedelta(days=30)
    
    ad.status = "approved"
    db.session.commit()
    
    return jsonify({"message": "Ad approved.", "ad": ad.to_dict()}), 200

@admin_bp.route("/ads/<int:ad_id>/reject", methods=["POST"])
@jwt_required()
def reject_ad(ad_id):
    """Admin: Reject ad and optionally delete image."""
    from app import db
    from app.models import Ad
    import os
    from pathlib import Path
    
    err = _require_admin()
    if err:
        return err
    
    ad = Ad.query.get_or_404(ad_id)
    
    if ad.status != "pending":
        return jsonify({"message": "Ad is not pending approval."}), 400
    
    # Delete image file
    try:
        current_file = Path(__file__).resolve()
        backend_dir = current_file.parent.parent
        uploads_dir = backend_dir / "uploads" / "ads"
        
        filename = ad.image_url.split("/")[-1]
        file_path = uploads_dir / filename
        if file_path.exists():
            os.remove(file_path)
    except Exception as e:
        print(f"Error deleting ad image: {str(e)}")
    
    ad.status = "rejected"
    db.session.commit()
    
    return jsonify({"message": "Ad rejected."}), 200