from flask_jwt_extended import create_access_token, decode_token
from datetime import datetime, timedelta
from models import db
from models.user import User
from utils.auth_utils import (
    log_auth_attempt, log_security_event, check_rate_limit_exceeded,
    validate_password_strength, sanitize_input
)
from email_utils import send_password_reset_email, send_2fa_backup_codes_email


class AuthService:
    
    @staticmethod
    def authenticate_user(email, password):
        """
        Autentica un usuario con email y contraseña
        Retorna: dict con resultado de la autenticación
        """
        user = User.query.filter_by(email=email).first()
        
        # Verificar si la cuenta está bloqueada primero
        if user and user.is_locked():
            return {
                'success': False,
                'message': 'Cuenta bloqueada temporalmente',
                'code': 'ACCOUNT_LOCKED',
                'status_code': 423
            }
        
        # Verificar credenciales
        if not user or not user.check_password(password):
            if user:  # Usuario existe pero contraseña incorrecta
                user.failed_login_attempts += 1
                
                # Verificar si se debe bloquear la cuenta
                if check_rate_limit_exceeded(user):
                    db.session.commit()
                    return {
                        'success': False,
                        'message': 'Cuenta bloqueada por múltiples intentos fallidos',
                        'code': 'ACCOUNT_LOCKED',
                        'status_code': 423
                    }
                
                db.session.commit()
                log_auth_attempt(user=user, event_type='login', success=False, failure_reason='invalid_password')
            else:
                # Usuario no existe - log sin user
                log_auth_attempt(event_type='login', success=False, failure_reason='user_not_found')
            
            return {
                'success': False,
                'message': 'Credenciales inválidas',
                'code': 'INVALID_CREDENTIALS',
                'status_code': 401
            }
        
        # Si tiene 2FA activado
        if user.two_factor_enabled:
            temp_token = create_access_token(
                identity=str(user.id),
                expires_delta=timedelta(minutes=5),
                additional_claims={'pre_2fa': True}
            )
            return {
                'success': True,
                'requiresTwoFactor': True,
                'tempToken': temp_token,
                'message': 'Ingresa tu código 2FA',
                'status_code': 200
            }
        
        # Login exitoso sin 2FA
        return AuthService._complete_login(user)
    
    @staticmethod
    def verify_2fa_code(temp_token, totp_code):
        """
        Verifica el código 2FA y completa el login
        """
        try:
            decoded_token = decode_token(temp_token)
            
            if not decoded_token.get('pre_2fa'):
                return {
                    'success': False,
                    'message': 'Token inválido para verificación 2FA',
                    'code': 'INVALID_TOKEN',
                    'status_code': 403
                }
            
            user_id = decoded_token['sub']
            
        except Exception:
            return {
                'success': False,
                'message': 'Token inválido o expirado',
                'code': 'INVALID_TOKEN',
                'status_code': 401
            }
        
        user = User.query.get(int(user_id))
        
        if not user:
            return {
                'success': False,
                'message': 'Usuario no encontrado',
                'code': 'USER_NOT_FOUND',
                'status_code': 404
            }
        
        if not user.verify_totp(totp_code):
            user.failed_login_attempts += 1
            
            if check_rate_limit_exceeded(user):
                db.session.commit()
                return {
                    'success': False,
                    'message': 'Cuenta bloqueada por múltiples intentos fallidos de 2FA',
                    'code': 'ACCOUNT_LOCKED',
                    'status_code': 423
                }
            
            db.session.commit()
            log_auth_attempt(user=user, event_type='2fa_verify', success=False, failure_reason='invalid_2fa_code')
            
            return {
                'success': False,
                'message': 'Código 2FA inválido o expirado',
                'code': 'INVALID_2FA_CODE',
                'status_code': 401
            }
        
        # Login exitoso
        return AuthService._complete_login(user, two_factor_used=True)
    
    @staticmethod
    def _complete_login(user, two_factor_used=False):
        """
        Completa el proceso de login exitoso
        """
        user.reset_failed_attempts()
        db.session.commit()
        
        access_token = create_access_token(identity=str(user.id))
        log_auth_attempt(user=user, event_type='login', success=True, two_factor_used=two_factor_used)
        
        return {
            'success': True,
            'requiresTwoFactor': False,
            'token': access_token,
            'user': {
                'id': str(user.id),
                'email': user.email,
                'name': user.username,
                'twoFactorEnabled': user.two_factor_enabled,
                'createdAt': user.created_at.isoformat() + 'Z',
                'lastLogin': datetime.utcnow().isoformat() + 'Z'
            },
            'message': 'Login exitoso',
            'status_code': 200
        }
    
    @staticmethod
    def setup_2fa(user):
        """
        Configura 2FA para un usuario
        """
        if user.two_factor_enabled:
            return {
                'success': False,
                'message': '2FA ya está habilitado',
                'code': '2FA_ALREADY_ENABLED',
                'status_code': 400
            }
        
        secret = user.generate_totp_secret()
        db.session.commit()
        
        totp_uri = user.get_totp_uri("SecureApp")
        manual_key = " ".join([secret[i:i+4] for i in range(0, len(secret), 4)])
        backup_codes = user.generate_backup_codes()
        
        return {
            'success': True,
            'secret': secret,
            'qrCodeUrl': totp_uri,
            'manualEntryKey': manual_key,
            'backupCodes': backup_codes,
            'status_code': 200
        }
    
    @staticmethod
    def enable_2fa(user, totp_code):
        """
        Habilita 2FA después de verificar el código
        """
        if not user.verify_totp(totp_code):
            return {
                'success': False,
                'message': 'Código 2FA inválido',
                'code': 'INVALID_2FA_CODE',
                'status_code': 401
            }
        
        user.two_factor_enabled = True
        backup_codes = user.generate_backup_codes()
        db.session.commit()
        
        # Enviar códigos de respaldo por email
        send_2fa_backup_codes_email(user.email, backup_codes)
        
        return {
            'success': True,
            'recoveryCodes': backup_codes,
            'status_code': 200
        }
    
    @staticmethod
    def disable_2fa(user, totp_code):
        """
        Deshabilita 2FA después de verificar el código
        """
        if not user.two_factor_enabled:
            return {
                'success': False,
                'message': '2FA no está habilitado',
                'code': '2FA_NOT_ENABLED',
                'status_code': 400
            }
        
        if not user.verify_totp(totp_code):
            return {
                'success': False,
                'message': 'Código 2FA inválido',
                'code': 'INVALID_2FA_CODE',
                'status_code': 401
            }
        
        user.two_factor_enabled = False
        user.totp_secret = None
        user.backup_codes = None
        db.session.commit()
        
        return {
            'success': True,
            'status_code': 200
        }
    
    @staticmethod
    def change_password(user, current_password, new_password):
        """
        Cambia la contraseña del usuario
        """
        if not user.check_password(current_password):
            return {
                'success': False,
                'message': 'Contraseña actual incorrecta',
                'code': 'WRONG_PASSWORD',
                'status_code': 401
            }
        
        password_errors = validate_password_strength(new_password)
        if password_errors:
            return {
                'success': False,
                'message': 'Contraseña débil',
                'code': 'WEAK_PASSWORD',
                'details': password_errors,
                'status_code': 400
            }
        
        user.set_password(new_password)
        db.session.commit()
        
        return {
            'success': True,
            'message': 'Contraseña actualizada exitosamente',
            'status_code': 200
        }
    
    @staticmethod
    def forgot_password(email):
        """
        Envía email de recuperación de contraseña
        """
        # Enviar email real
        send_password_reset_email(email)
        
        # Siempre devolver éxito por seguridad (no revelar si el email existe)
        return {
            'success': True,
            'message': 'Email de recuperación enviado',
            'status_code': 200
        }
    
    @staticmethod
    def reset_password(token, new_password):
        """
        Resetea la contraseña usando el token de recuperación
        """
        # Validar contraseña
        password_errors = validate_password_strength(new_password)
        if password_errors:
            return {
                'success': False,
                'message': 'Contraseña débil',
                'code': 'WEAK_PASSWORD',
                'details': password_errors,
                'status_code': 400
            }
        
        # Buscar usuario por el token de reset almacenado
        user = User.query.filter_by(reset_token=token).first()
        
        if not user:
            return {
                'success': False,
                'message': 'Token inválido o expirado',
                'code': 'INVALID_TOKEN',
                'status_code': 400
            }
        
        # Verificar si el token ha expirado (1 hora)
        if user.reset_token_expires and user.reset_token_expires < datetime.utcnow():
            # Limpiar token expirado
            user.reset_token = None
            user.reset_token_expires = None
            db.session.commit()
            
            return {
                'success': False,
                'message': 'Token expirado',
                'code': 'TOKEN_EXPIRED',
                'status_code': 400
            }
        
        # Cambiar contraseña y limpiar token
        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expires = None
        db.session.commit()
        
        return {
            'success': True,
            'message': f'Contraseña restablecida para {user.email}',
            'status_code': 200
        }
    
    @staticmethod
    def register_user(username, email, password):
        """
        Registra un nuevo usuario
        """
        from utils.auth_utils import validate_username, validate_email
        
        if not validate_username(username):
            return {
                'success': False,
                'message': 'Username inválido',
                'code': 'INVALID_USERNAME',
                'status_code': 400
            }
        
        if not validate_email(email):
            return {
                'success': False,
                'message': 'Email inválido',
                'code': 'INVALID_EMAIL',
                'status_code': 400
            }
        
        password_errors = validate_password_strength(password)
        if password_errors:
            return {
                'success': False,
                'message': 'Contraseña débil',
                'code': 'WEAK_PASSWORD',
                'details': password_errors,
                'status_code': 400
            }
        
        if User.query.filter_by(username=username).first():
            return {
                'success': False,
                'message': 'El usuario ya existe',
                'code': 'USER_EXISTS',
                'status_code': 400
            }
        
        if User.query.filter_by(email=email).first():
            return {
                'success': False,
                'message': 'El email ya está registrado',
                'code': 'EMAIL_EXISTS',
                'status_code': 400
            }
        
        user = User(username=username, email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        log_auth_attempt(user=user, event_type='register', success=True)
        
        return {
            'success': True,
            'message': 'Usuario registrado exitosamente',
            'status_code': 201
        }