from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman

# Importar configuración y modelos
from config.config import Config
from models import db
from email_utils import mail

# Importar middleware
from middleware.auth_middleware import jwt_error_handlers

SSL_CERT = './dev.crt'
SSL_KEY = './dev.key'

def create_app():
    """Factory para crear la aplicación Flask"""
    app = Flask(__name__)
    app.config.from_object(Config)

    # Inicializar extensiones
    db.init_app(app)
    
    # Configurar JWT
    jwt = JWTManager(app)
    jwt_error_handlers(jwt)
    
    # Configurar CORS
    CORS(app, 
         origins=["https://localhost:5173", "https://127.0.0.1:5173"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         allow_headers=["Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"],
         supports_credentials=True,
         expose_headers=["Authorization"])

    # Configurar Talisman (seguridad)
    Talisman(app, 
        force_https=True,
        strict_transport_security=False,
        content_security_policy={
            'default-src': "'self'",
            'script-src': "'self'",
            'style-src': "'self' 'unsafe-inline'"
        }
    )

    # Configurar Mail
    mail.init_app(app)
    
    # Configurar Rate Limiter
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"]
    )
    limiter.init_app(app)
    
    from routes.auth_routes import auth_bp, init_limiter
    init_limiter(limiter)
    app.register_blueprint(auth_bp)

    from routes.pppoe_routes import pppoe_bp
    app.register_blueprint(pppoe_bp)

    from routes.router_routes import router_bp
    app.register_blueprint(router_bp)

    from routes.firewall_routes import firewall_bp
    app.register_blueprint(firewall_bp)

    from routes.sync_routes import sync_bp
    app.register_blueprint(sync_bp)

    from routes.user_routes import user_bp
    app.register_blueprint(user_bp, url_prefix='/api/users')

    from routes.branch_routes import branch_bp
    app.register_blueprint(branch_bp)

    # Crear tablas
    with app.app_context():
        db.create_all()
    
    return app

# Crear instancia de la aplicación
app = create_app()

if __name__ == '__main__':
    if SSL_CERT and SSL_KEY:
        app.run(ssl_context=(SSL_CERT, SSL_KEY), port=5000)
    else:
        app.run(port=5000)
