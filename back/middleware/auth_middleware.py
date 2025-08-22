from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from models import User


def jwt_error_handlers(jwt_manager):
    """Configurar manejadores de errores JWT"""
    
    @jwt_manager.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'message': 'Token expirado',
            'code': 'TOKEN_EXPIRED'
        }), 401

    @jwt_manager.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'success': False,
            'message': 'Token inválido',
            'code': 'INVALID_TOKEN'
        }), 401

    @jwt_manager.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'success': False,
            'message': 'Token requerido',
            'code': 'TOKEN_REQUIRED'
        }), 401


def require_2fa_enabled(f):
    """Decorador que requiere 2FA habilitado"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Usuario no encontrado',
                'code': 'USER_NOT_FOUND'
            }), 404
        
        if not user.two_factor_enabled:
            return jsonify({
                'success': False,
                'message': 'Esta acción requiere autenticación de dos factores habilitada',
                'code': '2FA_REQUIRED'
            }), 403
        
        return f(*args, **kwargs)
    return decorated_function


def require_admin_role(f):
    """Decorador que requiere rol de administrador"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Usuario no encontrado',
                'code': 'USER_NOT_FOUND'
            }), 404
        
        if not user.is_admin():
            return jsonify({
                'success': False,
                'message': 'Acceso denegado: Se requieren permisos de administrador',
                'code': 'ADMIN_REQUIRED'
            }), 403
        
        return f(*args, **kwargs)
    return decorated_function

def require_auth(f):
    """Decorador que requiere autenticación JWT válida"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'}), 200
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))

            if not user:
                return jsonify({
                    'success': False,
                    'message': 'Usuario no encontrado',
                    'code': 'USER_NOT_FOUND'
                }), 404

            return f(*args, **kwargs)
        except Exception:
            return jsonify({
                'success': False,
                'message': 'Token inválido o expirado',
                'code': 'INVALID_TOKEN'
            }), 401
    return decorated_function

def get_current_user():
    """Obtiene el usuario actual desde el token JWT"""
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        return User.query.get(int(user_id))
    except:
        return None
    
def log_request():
    """Middleware para logging de requests"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Log request info
            print(f"Request: {request.method} {request.path} from {request.remote_addr}")
            return f(*args, **kwargs)
        return decorated_function
    return decorator