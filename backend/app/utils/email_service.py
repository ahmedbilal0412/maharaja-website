from flask import current_app, render_template_string
from flask_mail import Message
from datetime import datetime
import os

def send_email(to_email, subject, html_content, text_content=None):
    """Generic function to send emails."""
    from app import mail
    try:
        msg = Message(
            subject=subject,
            recipients=[to_email],
            html=html_content,
            body=text_content
        )
        mail.send(msg)
        print(f"Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        print(f"Error sending email to {to_email}: {str(e)}")
        return False

def send_welcome_email(user):
    """Send welcome email when a user creates an account."""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Maharaja Builders</title>
        <style>
            body {{ font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px; }}
            .header {{ text-align: center; padding: 20px 0; border-bottom: 3px solid #d4af37; }}
            .logo {{ max-width: 150px; }}
            .content {{ padding: 30px 20px; }}
            .button {{ display: inline-block; padding: 12px 30px; background: #0b3d2e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: 600; }}
            .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #ddd; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://maharajabuilders.pk/img/maharaja.png" alt="Maharaja Builders" class="logo" style="max-width: 150px;">
                <h2 style="color: #0b3d2e;">Welcome to Maharaja Builders!</h2>
            </div>
            <div class="content">
                <p>Dear {user.full_name},</p>
                <p>Thank you for joining Maharaja Builders & Realtors! We're excited to help you find your dream property or list your property for sale.</p>
                <p>With your account, you can:</p>
                <ul>
                    <li>List your properties for sale or rent</li>
                    <li>Browse thousands of premium properties</li>
                    <li>Connect with verified sellers and buyers</li>
                    <li>Track your listings and get insights</li>
                </ul>
                <div style="text-align: center;">
                    <a href="https://maharajabuilders.pk/properties.html" class="button">Start Exploring</a>
                </div>
                <p>If you have any questions, feel free to contact our support team.</p>
                <p>Best regards,<br>Maharaja Builders Team</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 Maharaja Builders & Realtors. All rights reserved.</p>
                <p><a href="https://maharajabuilders.pk" style="color: #0b3d2e;">Visit our website</a></p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(user.email, "Welcome to Maharaja Builders!", html)

def send_login_notification(user, ip_address=None):
    """Send login notification email."""
    location_text = f" from IP: {ip_address}" if ip_address else ""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Login Notification - Maharaja Builders</title>
        <style>
            body {{ font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px; }}
            .header {{ text-align: center; padding: 20px 0; border-bottom: 3px solid #d4af37; }}
            .content {{ padding: 30px 20px; }}
            .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #ddd; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://maharajabuilders.pk/img/maharaja.png" alt="Maharaja Builders" class="logo" style="max-width: 150px;">
                <h2 style="color: #0b3d2e;">New Login Detected</h2>
            </div>
            <div class="content">
                <p>Dear {user.full_name},</p>
                <p>Your account was just logged into{location_text} at {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC.</p>
                <p>If this was you, you can safely ignore this email.</p>
                <p>If you didn't perform this action, please reset your password immediately:</p>
                <div style="text-align: center;">
                    <a href="https://maharajabuilders.pk/forgot-password.html" class="button" style="display: inline-block; padding: 12px 30px; background: #0b3d2e; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
                </div>
                <p>Best regards,<br>Maharaja Builders Team</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 Maharaja Builders & Realtors. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(user.email, "Login Notification - Maharaja Builders", html)

def send_property_created_email(user, property):
    """Send notification when a property is created."""
    status_text = "approved and live" if property.status == "approved" else "submitted for admin approval"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Property Submitted - Maharaja Builders</title>
        <style>
            body {{ font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px; }}
            .header {{ text-align: center; padding: 20px 0; border-bottom: 3px solid #d4af37; }}
            .content {{ padding: 30px 20px; }}
            .property-details {{ background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }}
            .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #ddd; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://maharajabuilders.pk/img/maharaja.png" alt="Maharaja Builders" class="logo" style="max-width: 150px;">
                <h2 style="color: #0b3d2e;">Property {status_text.upper()}</h2>
            </div>
            <div class="content">
                <p>Dear {user.full_name},</p>
                <p>Your property "<strong>{property.title}</strong>" has been {status_text}.</p>
                <div class="property-details">
                    <p><strong>Location:</strong> {property.location}</p>
                    <p><strong>Price:</strong> PKR {property.price:,}</p>
                    <p><strong>Type:</strong> {property.property_type}</p>
                </div>
                <div style="text-align: center;">
                    <a href="https://maharajabuilders.pk/property-details.html?id={property.id}" class="button" style="display: inline-block; padding: 12px 30px; background: #0b3d2e; color: white; text-decoration: none; border-radius: 5px;">View Property</a>
                </div>
                <p>Thank you for choosing Maharaja Builders!</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 Maharaja Builders & Realtors. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(user.email, f"Property {status_text} - Maharaja Builders", html)

def send_property_deleted_email(user, property_title):
    """Send notification when a property is deleted."""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Property Deleted - Maharaja Builders</title>
        <style>
            body {{ font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px; }}
            .header {{ text-align: center; padding: 20px 0; border-bottom: 3px solid #d4af37; }}
            .content {{ padding: 30px 20px; }}
            .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #ddd; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://maharajabuilders.pk/img/maharaja.png" alt="Maharaja Builders" class="logo" style="max-width: 150px;">
                <h2 style="color: #0b3d2e;">Property Deleted</h2>
            </div>
            <div class="content">
                <p>Dear {user.full_name},</p>
                <p>Your property "<strong>{property_title}</strong>" has been successfully deleted from Maharaja Builders.</p>
                <p>If you didn't request this deletion, please contact our support team immediately.</p>
                <p>Best regards,<br>Maharaja Builders Team</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 Maharaja Builders & Realtors. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(user.email, "Property Deleted - Maharaja Builders", html)

def send_ad_created_email(user, ad):
    """Send notification when an ad is created."""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Ad Submitted - Maharaja Builders</title>
        <style>
            body {{ font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px; }}
            .header {{ text-align: center; padding: 20px 0; border-bottom: 3px solid #d4af37; }}
            .content {{ padding: 30px 20px; }}
            .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #ddd; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://maharajabuilders.pk/img/maharaja.png" alt="Maharaja Builders" class="logo" style="max-width: 150px;">
                <h2 style="color: #0b3d2e;">Ad Submitted for Approval</h2>
            </div>
            <div class="content">
                <p>Dear {user.full_name},</p>
                <p>Your advertisement has been submitted for admin approval. You will be notified once it's approved.</p>
                <p><strong>Duration:</strong> {ad.duration}</p>
                <p><strong>Amount Paid:</strong> PKR {ad.price:,}</p>
                <p>Once approved, your ad will appear on our homepage.</p>
                <p>Thank you for advertising with Maharaja Builders!</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 Maharaja Builders & Realtors. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(user.email, "Ad Submitted - Maharaja Builders", html)

def send_token_purchase_email(user, purchase):
    """Send notification when tokens are purchased."""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Token Purchase - Maharaja Builders</title>
        <style>
            body {{ font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px; }}
            .header {{ text-align: center; padding: 20px 0; border-bottom: 3px solid #d4af37; }}
            .content {{ padding: 30px 20px; }}
            .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #ddd; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://maharajabuilders.pk/img/maharaja.png" alt="Maharaja Builders" class="logo" style="max-width: 150px;">
                <h2 style="color: #0b3d2e;">Token Purchase Submitted</h2>
            </div>
            <div class="content">
                <p>Dear {user.full_name},</p>
                <p>Your request to purchase {purchase.token_count} premium tokens has been submitted for admin approval.</p>
                <p><strong>Tokens:</strong> {purchase.token_count}</p>
                <p><strong>Amount Paid:</strong> PKR {purchase.total_price:,}</p>
                <p>Once approved, the tokens will be added to your account.</p>
                <p>Thank you for your purchase!</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 Maharaja Builders & Realtors. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(user.email, "Token Purchase Request - Maharaja Builders", html)