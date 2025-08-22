from flask_mail import Mail, Message
from flask import current_app
import secrets
from datetime import datetime, timedelta
from models import db, User
import uuid

mail = Mail()

def send_password_reset_email(email):
    """Envía email de recuperación de contraseña"""
    try:
        user = User.query.filter_by(email=email).first()
        if not user:
            # Por seguridad, no revelar si el email existe
            return True
        
        # Generar token de reset
        reset_token = secrets.token_urlsafe(32)
        
        # Guardar token en la base de datos con expiración de 1 hora
        user.reset_token = reset_token
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        db.session.commit()
        
        # URL del frontend desde variables de entorno
        frontend_url = current_app.config.get('FRONTEND_URL', 'https://localhost:5173')
        reset_link = f"{frontend_url}/reset-password?token={reset_token}"
        
        msg = Message(
            subject='Recuperación de Contraseña - PLUS App',
            recipients=[email],
            html=f'''
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <h2 style="color: #333; text-align: center; margin-bottom: 25px; border-bottom: 2px solid #007bff; padding-bottom: 10px;">Recuperación de Contraseña</h2>
                
                <p style="font-size: 16px;">Hola <strong>{user.username}</strong>,</p>
                <p style="color: #555; line-height: 1.6;">Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para continuar:</p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="{reset_link}" 
                    style="background: linear-gradient(135deg, #007bff, #0056b3); 
                            color: white; padding: 15px 35px; text-decoration: none; 
                            border-radius: 8px; font-weight: bold; font-size: 16px;
                            display: inline-block; box-shadow: 0 3px 10px rgba(0,123,255,0.3);
                            transition: all 0.3s ease;">Restablecer Contraseña</a>
                </div>
                
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 5px;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                        <strong>Importante:</strong> Este enlace expira en 1 hora y solo se puede usar una vez.
                    </p>
                </div>
                
                <p style="color: #666; font-size: 14px; line-height: 1.5;">
                    Si no solicitaste este cambio, puedes ignorar este email de forma segura.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <div style="text-align: center;">
                    <p style="color: #999; font-size: 13px; margin: 0;">
                        Saludos,<br>
                        <strong style="color: #007bff;">Equipo PLUS App</strong>
                    </p>
                </div>
            </div>
        </div>
        ''',
        )
        
        mail.send(msg)
        return True
        
    except Exception as e:
        print(f"Error enviando email: {e}")
        return False

def send_2fa_backup_codes_email(email, backup_codes):
    """Envía códigos de respaldo 2FA por email"""
    try:
        user = User.query.filter_by(email=email).first()
        if not user:
            return False
        
        codes_html = '<br>'.join([f'<code>{code}</code>' for code in backup_codes])
        
        msg = Message(
            subject='Códigos de Respaldo 2FA - PLUS App',
            recipients=[email],
            html=f'''
            <h2>Códigos de Respaldo 2FA</h2>
            <p>Hola {user.username},</p>
            <p>Has habilitado la autenticación de dos factores. Aquí están tus códigos de respaldo:</p>
            <div style="background: #f5f5f5; padding: 15px; margin: 10px 0;">
                {codes_html}
            </div>
            <p><strong>Importante:</strong></p>
            <ul>
                <li>Guarda estos códigos en un lugar seguro</li>
                <li>Cada código solo se puede usar una vez</li>
                <li>Úsalos si no tienes acceso a tu app de autenticación</li>
            </ul>
            <br>
            <p>Saludos,<br>Equipo PLUS App</p>
            '''
        )
        
        mail.send(msg)
        return True
        
    except Exception as e:
        print(f"Error enviando códigos de respaldo: {e}")
        return False

def send_totp_code_email(email, totp_code):
    """Envía código TOTP por email como alternativa"""
    try:
        user = User.query.filter_by(email=email).first()
        if not user:
            return False
        
        msg = Message(
            subject='Código de Verificación 2FA - PLUS App',
            recipients=[email],
            html=f'''
            <h2>Código de Verificación</h2>
            <p>Hola {user.username},</p>
            <p>Tu código de verificación de dos factores es:</p>
            <div style="background: #f0f8ff; padding: 20px; margin: 15px 0; text-align: center; border: 2px solid #007bff; border-radius: 8px;">
                <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">{totp_code}</h1>
            </div>
            <p><strong>Este código:</strong></p>
            <ul>
                <li>Es válido por 5 minutos</li>
                <li>Solo se puede usar una vez</li>
                <li>No lo compartas con nadie</li>
            </ul>
            <p>Si no solicitaste este código, ignora este email.</p>
            <br>
            <p>Saludos,<br>Equipo PLUS App</p>
            '''
        )
        
        mail.send(msg)
        return True
        
    except Exception as e:
        print(f"Error enviando código TOTP: {e}")
        return False