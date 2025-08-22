from flask import Blueprint, jsonify
from app import db

health_bp = Blueprint('health', __name__)

@health_bp.route('/', methods=['GET'])
def health_check():
    """Health check básico"""
    return jsonify({
        'success': True,
        'status': 'healthy',
        'service': 'PLUS Backend API'
    }), 200

@health_bp.route('/database', methods=['GET'])
def database_health():
    """Verificar estado de la base de datos"""
    try:
        db.session.execute('SELECT 1')
        return jsonify({
            'success': True,
            'database': 'connected'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'database': 'error',
            'message': str(e)
        }), 500