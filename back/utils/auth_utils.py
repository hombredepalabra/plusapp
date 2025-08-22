from functools import wraps
from flask import request, jsonify, current_app
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from models.user import User, AuthLog, SecurityEvent
import re
import bleach
from markupsafe import escape


def get_client_info():
    """Obtiene información del cliente para logging"""
    return {
        'ip_address': request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr),
        'user_agent': request.headers.get('User-Agent', '')
    }

def validate_password_strength(password):
    """Valida la fortaleza de la contraseña según OWASP"""
    errors = []
    
    if len(password) < 8:
        errors.append("La contraseña debe tener al menos 8 caracteres")
    
    if not re.search(r'[A-Z]', password):
        errors.append("La contraseña debe contener al menos una letra mayúscula")
    
    if not re.search(r'[a-z]', password):
        errors.append("La contraseña debe contener al menos una letra minúscula")
    
    if not re.search(r'\d', password):
        errors.append("La contraseña debe contener al menos un número")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("La contraseña debe contener al menos un carácter especial")
    
    # Verificar patrones comunes débiles
    weak_patterns = [
        r'123456',
        r'password',
        r'qwerty',
        r'abc123',
        r'admin'
    ]
    
    for pattern in weak_patterns:
        if re.search(pattern, password.lower()):
            errors.append("La contraseña contiene patrones comunes débiles")
            break
    
    return errors

def validate_email(email):
    """Valida el formato del email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_username(username):
    """Valida el formato del username"""
    if len(username) < 3 or len(username) > 30:
        return False
    
    # Solo permitir letras, números y guiones bajos
    pattern = r'^[a-zA-Z0-9_]+$'
    return re.match(pattern, username) is not None

def log_auth_attempt(user=None, event_type='login', success=True, 
                    failure_reason=None, two_factor_used=False, 
                    backup_code_used=False):
    """Registra intentos de autenticación"""
    client_info = get_client_info()
    
    AuthLog.log_event(
        user_id=user.id if user else None,
        username=user.username if user else None,
        email=user.email if user else None,
        event_type=event_type,
        success=success,
        failure_reason=failure_reason,
        ip_address=client_info['ip_address'],
        user_agent=client_info['user_agent'],
        two_factor_used=two_factor_used,
        backup_code_used=backup_code_used
    )

def log_security_event(user_id=None, event_type=None, description=None, 
                      severity='medium'):
    """Registra eventos de seguridad"""
    client_info = get_client_info()
    
    SecurityEvent.log_security_event(
        user_id=user_id,
        event_type=event_type,
        description=description,
        severity=severity,
        ip_address=client_info['ip_address'],
        user_agent=client_info['user_agent']
    )

def require_2fa(f):
    """Decorador que requiere 2FA habilitado"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        if not user.two_factor_enabled:
            return jsonify({
                'error': 'Esta acción requiere autenticación de dos factores habilitada'
            }), 403
        
        return f(*args, **kwargs)
    return decorated_function

def sanitize_input(data):
    """Sanitiza datos de entrada para prevenir inyecciones"""
    if isinstance(data, str):
        # Remover caracteres potencialmente peligrosos
        data = bleach.clean(data, tags=[], strip=True)
        data = escape(data)
        # Limitar longitud
        data = data[:1000]
    elif isinstance(data, dict):
        sanitized = {}
        for key, value in data.items():
            sanitized[sanitize_input(key)] = sanitize_input(value)
        return sanitized
    elif isinstance(data, list):
        return [sanitize_input(item) for item in data]
    
    return data

def check_rate_limit_exceeded(user, max_attempts=5):
    """Verifica si se excedió el límite de intentos"""
    if user.failed_login_attempts >= max_attempts:
        if not user.is_locked():
            user.lock_account()
            log_security_event(
                user_id=user.id,
                event_type='account_locked',
                description=f'Cuenta bloqueada por {max_attempts} intentos fallidos',
                severity='high'
            )
        return True
    return False