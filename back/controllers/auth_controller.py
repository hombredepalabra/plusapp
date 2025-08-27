from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from services.auth_service import AuthService
from utils.auth_utils import sanitize_input
import logging
class AuthController:
    
    @staticmethod
    def login():
        """Endpoint para login inicial"""
        try:
            data = sanitize_input(request.get_json(force=True, silent=True) or {})
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')
            
            if not email or not password:
                return jsonify({
                    'success': False,
                    'message': 'Email y contraseña son requeridos',
                    'code': 'MISSING_FIELDS'
                }), 400
            
            result = AuthService.authenticate_user(email, password)
            return jsonify(result), result['status_code']
            
        except Exception as e:
            logging.error(f"Error en login: {str(e)}", exc_info=True)
            return jsonify({
                'success': False,
                'message': 'Error interno del servidor',
                'code': 'INTERNAL_ERROR'
            }), 500
    
    @staticmethod
    def verify_2fa():
        """Endpoint para verificar código 2FA"""
        try:
            data = sanitize_input(request.get_json())
            temp_token = data.get('token', '').strip()
            totp_code = data.get('totpCode', '').strip()
            
            if not temp_token or not totp_code:
                return jsonify({
                    'success': False,
                    'message': 'Token y código 2FA son requeridos',
                    'code': 'MISSING_FIELDS'
                }), 400
            
            result = AuthService.verify_2fa_code(temp_token, totp_code)
            return jsonify(result), result['status_code']
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': 'Error interno del servidor',
                'code': 'INTERNAL_ERROR'
            }), 500
    
    @staticmethod
    def get_profile():
        """Endpoint para obtener perfil del usuario"""
        try:
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))
            
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'Usuario no encontrado',
                    'code': 'USER_NOT_FOUND'
                }), 404

            return jsonify(user.to_dict()), 200
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': 'Error interno del servidor',
                'code': 'INTERNAL_ERROR'
            }), 500
    
    @staticmethod
    def setup_2fa():
        """Endpoint para configurar 2FA"""
        try:
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))
            
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'Usuario no encontrado',
                    'code': 'USER_NOT_FOUND'
                }), 404
            
            result = AuthService.setup_2fa(user)
            return jsonify(result), result['status_code']
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': 'Error interno del servidor',
                'code': 'INTERNAL_ERROR'
            }), 500
    
    @staticmethod
    def enable_2fa():
        """Endpoint para habilitar 2FA"""
        try:
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))
            
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'Usuario no encontrado',
                    'code': 'USER_NOT_FOUND'
                }), 404
            
            data = sanitize_input(request.get_json())
            totp_code = data.get('totpCode', '').strip()
            
            if not totp_code:
                return jsonify({
                    'success': False,
                    'message': 'Código TOTP requerido',
                    'code': '2FA_REQUIRED'
                }), 400
            
            result = AuthService.enable_2fa(user, totp_code)
            return jsonify(result), result['status_code']
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': 'Error interno del servidor',
                'code': 'INTERNAL_ERROR'
            }), 500
    
    @staticmethod
    def disable_2fa():
        """Endpoint para deshabilitar 2FA"""
        try:
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))
            
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'Usuario no encontrado',
                    'code': 'USER_NOT_FOUND'
                }), 404
            
            data = sanitize_input(request.get_json())
            totp_code = data.get('totpCode', '').strip()
            
            if not totp_code:
                return jsonify({
                    'success': False,
                    'message': 'Código TOTP requerido',
                    'code': '2FA_REQUIRED'
                }), 400
            
            result = AuthService.disable_2fa(user, totp_code)
            return jsonify(result), result['status_code']
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': 'Error interno del servidor',
                'code': 'INTERNAL_ERROR'
            }), 500
    
    @staticmethod
    def change_password():
        """Endpoint para cambiar contraseña"""
        try:
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))
            
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'Usuario no encontrado',
                    'code': 'USER_NOT_FOUND'
                }), 404
            
            data = sanitize_input(request.get_json())
            current_password = data.get('currentPassword', '')
            new_password = data.get('newPassword', '')
            
            if not current_password or not new_password:
                return jsonify({
                    'success': False,
                    'message': 'Contraseña actual y nueva son requeridas',
                    'code': 'MISSING_FIELDS'
                }), 400
            
            result = AuthService.change_password(user, current_password, new_password)
            return jsonify(result), result['status_code']
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': 'Error interno del servidor',
                'code': 'INTERNAL_ERROR'
            }), 500
    
    @staticmethod
    def forgot_password():
        """Endpoint para solicitar recuperación de contraseña"""
        try:
            data = sanitize_input(request.get_json())
            email = data.get('email', '').strip().lower()
            
            if not email:
                return jsonify({
                    'success': False,
                    'message': 'Email es requerido',
                    'code': 'MISSING_EMAIL'
                }), 400
            
            result = AuthService.forgot_password(email)
            return jsonify(result), result['status_code']
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': 'Error interno del servidor',
                'code': 'INTERNAL_ERROR'
            }), 500
    
    @staticmethod
    def reset_password():
        """Endpoint para resetear contraseña"""
        try:
            data = sanitize_input(request.get_json())
            token = data.get('token', '')
            new_password = data.get('newPassword', '')
            
            if not token or not new_password:
                return jsonify({
                    'success': False,
                    'message': 'Token y nueva contraseña son requeridos',
                    'code': 'MISSING_FIELDS'
                }), 400
            
            result = AuthService.reset_password(token, new_password)
            return jsonify(result), result['status_code']
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': 'Error interno del servidor',
                'code': 'INTERNAL_ERROR'
            }), 500
    
    @staticmethod
    def register():
        """Endpoint para registro de usuarios"""
        try:
            data = sanitize_input(request.get_json())
            username = data.get('username', '').strip()
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')
            
            if not username or not email or not password:
                return jsonify({
                    'success': False,
                    'message': 'Todos los campos son requeridos',
                    'code': 'MISSING_FIELDS'
                }), 400
            
            result = AuthService.register_user(username, email, password)
            return jsonify(result), result['status_code']
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': 'Error interno del servidor',
                'code': 'INTERNAL_ERROR'
            }), 500