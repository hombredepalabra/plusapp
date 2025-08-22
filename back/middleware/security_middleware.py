from flask import request, jsonify

def init_security_headers(app):
    """Inicializa headers de seguridad"""
    @app.after_request
    def set_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response

def rate_limit_handler():
    """Handler para rate limiting"""
    return jsonify({
        'error': 'Demasiadas solicitudes',
        'message': 'Has excedido el límite de solicitudes por minuto'
    }), 429