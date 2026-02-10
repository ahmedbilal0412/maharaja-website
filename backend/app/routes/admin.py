from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app import db
from app.models import Property, User, PROPERTY_STATUS_APPROVED, PROPERTY_STATUS_PENDING

admin_bp = Blueprint("admin", __name__)


def _require_admin():
    claims = get_jwt()
    if not claims.get("is_admin"):
        return jsonify({"message": "Admin access required."}), 403
    return None


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
    db.session.delete(prop)
    db.session.commit()
    return jsonify({"message": "Property rejected and removed."}), 200
