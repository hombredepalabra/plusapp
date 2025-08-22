from flask import Blueprint
from flask_jwt_extended import jwt_required
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from controllers.auth_controller import AuthController

# Crear el blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Rate limiter (debe ser inicializado desde la app principal)
limiter = None

def init_limiter(app_limiter):
    """Inicializar el limiter desde la app principal"""
    global limiter
    limiter = app_limiter

# ============= RUTAS DE AUTENTICACIÓN =============

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login inicial (usuario/password)"""
    if limiter:
        return limiter.limit("10 per minute")(AuthController.login)()
    return AuthController.login()

@auth_bp.route('/verify-2fa', methods=['POST'])
def verify_2fa():
    """Verificar código 2FA"""
    if limiter:
        return limiter.limit("5 per minute")(AuthController.verify_2fa)()
    return AuthController.verify_2fa()

@auth_bp.route('/setup-2fa', methods=['POST'])
@jwt_required()
def setup_2fa():
    """Configurar 2FA"""
    if limiter:
        return limiter.limit("3 per minute")(AuthController.setup_2fa)()
    return AuthController.setup_2fa()

@auth_bp.route('/enable-2fa', methods=['POST'])
@jwt_required()
def enable_2fa():
    """Habilitar 2FA"""
    if limiter:
        return limiter.limit("5 per minute")(AuthController.enable_2fa)()
    return AuthController.enable_2fa()

@auth_bp.route('/disable-2fa', methods=['POST'])
@jwt_required()
def disable_2fa():
    """Deshabilitar 2FA"""
    if limiter:
        return limiter.limit("3 per minute")(AuthController.disable_2fa)()
    return AuthController.disable_2fa()

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Cambiar contraseña"""
    if limiter:
        return limiter.limit("5 per minute")(AuthController.change_password)()
    return AuthController.change_password()

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Recuperar contraseña"""
    if limiter:
        return limiter.limit("3 per minute")(AuthController.forgot_password)()
    return AuthController.forgot_password()


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Resetear contraseña"""
    if limiter:
        return limiter.limit("5 per minute")(AuthController.reset_password)()
    return AuthController.reset_password()

@auth_bp.route('/register', methods=['POST'])
def register():
    """Registro de usuarios"""
    if limiter:
        return limiter.limit("5 per minute")(AuthController.register)()
    return AuthController.register()

