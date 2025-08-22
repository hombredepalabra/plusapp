from flask import jsonify

def configure_jwt_handlers(jwt):
    """Configurar manejadores de errores JWT"""
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'message': 'Token expirado',
            'code': 'TOKEN_EXPIRED'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'success': False,
            'message': 'Token inválido',
            'code': 'INVALID_TOKEN'
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'success': False,
            'message': 'Token requerido',
            'code': 'TOKEN_REQUIRED'
        }), 401