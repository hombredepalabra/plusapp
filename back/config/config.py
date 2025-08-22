import os
import secrets
from datetime import timedelta
from dotenv import load_dotenv

# Cargar variables del archivo .env
load_dotenv()

def get_bool_env(var_name, default=False):
    """Convertir string de variable de entorno a boolean"""
    value = os.environ.get(var_name, str(default)).lower()
    return value in ('true', '1', 'yes', 'on')

def get_int_env(var_name, default=0):
    """Convertir string de variable de entorno a entero"""
    try:
        return int(os.environ.get(var_name, default))
    except (ValueError, TypeError):
        return default

class Config:
    # ========================================
    # CONFIGURACIÓN DE SEGURIDAD
    # ========================================
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    
    # ========================================
    # CONFIGURACIÓN DE BASE DE DATOS
    # ========================================
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # ========================================
    # CONFIGURACIÓN JWT
    # ========================================
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=get_int_env('JWT_ACCESS_TOKEN_EXPIRES_HOURS', 1))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=get_int_env('JWT_REFRESH_TOKEN_EXPIRES_DAYS', 30))
    
    # ========================================
    # CONFIGURACIÓN DE RATE LIMITING
    # ========================================
    RATELIMIT_STORAGE_URL = os.environ.get('RATELIMIT_STORAGE_URL') or "memory://"
    
    # ========================================
    # CONFIGURACIÓN 2FA
    # ========================================
    TOTP_ISSUER_NAME = os.environ.get('TOTP_ISSUER_NAME') or "PLUS App"
    TOTP_VALID_WINDOW = get_int_env('TOTP_VALID_WINDOW', 1)
    
    # ========================================
    # CONFIGURACIÓN DE SEGURIDAD DE CONTRASEÑAS
    # ========================================
    MIN_PASSWORD_LENGTH = get_int_env('MIN_PASSWORD_LENGTH', 8)
    REQUIRE_SPECIAL_CHARS = get_bool_env('REQUIRE_SPECIAL_CHARS', True)
    REQUIRE_NUMBERS = get_bool_env('REQUIRE_NUMBERS', True)
    REQUIRE_UPPERCASE = get_bool_env('REQUIRE_UPPERCASE', True)
    
    # ========================================
    # CONFIGURACIÓN DE INTENTOS DE LOGIN
    # ========================================
    MAX_LOGIN_ATTEMPTS = get_int_env('MAX_LOGIN_ATTEMPTS', 5)
    LOCKOUT_DURATION = timedelta(minutes=get_int_env('LOCKOUT_DURATION_MINUTES', 15))
    
    # ========================================
    # CONFIGURACIÓN DE EMAIL
    # ========================================
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or 'smtp.gmail.com'
    MAIL_PORT = get_int_env('MAIL_PORT', 587)
    MAIL_USE_TLS = get_bool_env('MAIL_USE_TLS', True)
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_USERNAME')
    
    # ========================================
    # CONFIGURACIÓN DEL ENTORNO
    # ========================================
    FLASK_ENV = os.environ.get('FLASK_ENV') or 'production'
    
    @staticmethod
    def validate_config():
        """Validar que las variables críticas estén configuradas"""
        required_vars = [
            'SECRET_KEY',
            'JWT_SECRET_KEY',
            'DATABASE_URL'
        ]
        
        missing_vars = []
        for var in required_vars:
            if not os.environ.get(var):
                missing_vars.append(var)
        
        if missing_vars:
            print(f"⚠️  Variables faltantes en .env: {', '.join(missing_vars)}")
            print("📝 Asegúrate de configurar todas las variables en tu archivo .env")
            return False
        
        return True
    
    @staticmethod
    def init_app(app):
        """Inicializar configuración de la aplicación"""
        if not Config.validate_config():
            raise ValueError("Configuración incompleta. Revisa tu archivo .env")
        
        # Configuraciones adicionales de la app
        if app.config['FLASK_ENV'] == 'development':
            app.config['DEBUG'] = True
        else:
            app.config['DEBUG'] = False