from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.user import User, SecurityEvent
from utils.decorators import require_role, handle_errors
from utils.validators import validate_email, validate_password
from utils.response import success_response, error_response
from utils.validation import validate_required_fields

class UserController:
    @staticmethod
    @jwt_required()
    @require_role('admin')
    @handle_errors
    def get_users():
        """GET /api/users - Listar usuarios (admin)"""
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Limit per_page to prevent abuse
        per_page = min(per_page, 100)
        
        users = User.query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        result = []
        for user in users.items:
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'is_active': user.is_active,
                'two_factor_enabled': user.two_factor_enabled,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'updated_at': user.updated_at.isoformat() if user.updated_at else None
            }
            result.append(user_data)
        
        return success_response({
            'users': result,
            'pagination': {
                'page': users.page,
                'per_page': users.per_page,
                'total': users.total,
                'pages': users.pages
            }
        })
    
    @staticmethod
    @jwt_required()
    def get_user(user_id):
        """GET /api/users/{id} - Obtener usuario específico"""
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if current_user.role != 'admin' and current_user_id != user_id:
            return jsonify({'error': 'Acceso denegado'}), 403
        
        user = User.query.get_or_404(user_id)
        return jsonify(user.to_dict()), 200
    
    @staticmethod
    @jwt_required()
    @require_role('admin')
    @handle_errors
    def create_user():
        """POST /api/users - Crear usuario (admin)"""
        
        data = request.get_json()
        
        # Validar campos requeridos
        required_fields = ['username', 'email', 'password']
        is_valid, message = validate_required_fields(data, required_fields)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Validar formato de email
        if not validate_email(data['email']):
            return jsonify({'error': 'Formato de email inválido'}), 400
        
        # Validar fortaleza de contraseña
        is_valid, message = validate_password(data['password'])
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Validar email único
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email ya existe'}), 400
        
        # Validar username único
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username ya existe'}), 400
        
        user = User(
            username=data['username'],
            email=data['email'],
            role=data.get('role', 'user'),
            is_active=data.get('is_active', True)
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'id': user.id,
            'message': 'Usuario creado exitosamente'
        }), 201
    
    @staticmethod
    @jwt_required()
    def update_user(user_id):
        """PUT /api/users/{id} - Actualizar usuario"""
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if current_user.role != 'admin' and current_user_id != user_id:
            return jsonify({'error': 'Acceso denegado'}), 403
        
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        # Solo admin puede cambiar rol
        if 'role' in data and current_user.role != 'admin':
            return jsonify({'error': 'No autorizado para cambiar rol'}), 403
        
        user.username = data.get('username', user.username)
        user.email = data.get('email', user.email)
        if current_user.role == 'admin':
            user.role = data.get('role', user.role)
            user.is_active = data.get('is_active', user.is_active)
        
        db.session.commit()
        return jsonify({'message': 'Usuario actualizado'}), 200
    
    @staticmethod
    @jwt_required()
    @require_role('admin')
    @handle_errors
    def delete_user(user_id):
        """DELETE /api/users/{id} - Eliminar usuario (admin)"""
        
        user = User.query.get_or_404(user_id)
        user.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Usuario eliminado'}), 200
    
    @staticmethod
    @jwt_required()
    @handle_errors
    def get_profile():
        """GET /api/users/profile - Perfil del usuario actual"""
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(current_user_id)
        return jsonify(user.to_dict()), 200
    
    @staticmethod
    @jwt_required()
    @handle_errors
    def update_profile():
        """PUT /api/users/profile - Actualizar perfil propio"""
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(current_user_id)
        data = request.get_json()
        
        user.username = data.get('username', user.username)
        user.email = data.get('email', user.email)
        
        db.session.commit()
        return jsonify({'message': 'Perfil actualizado'}), 200
    
    @staticmethod
    @jwt_required()
    @handle_errors
    def change_password():
        """PUT /api/users/change-password - Cambiar contraseña"""
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(current_user_id)
        data = request.get_json()
        
        if not user.check_password(data['current_password']):
            return jsonify({'error': 'Contraseña actual incorrecta'}), 400
        
        user.set_password(data['new_password'])
        
        # Log evento de seguridad
        SecurityEvent.log_security_event(
            user_id=user.id,
            event_type='password_changed',
            description='Password changed by user',
            severity='medium',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.commit()
        
        return jsonify({'message': 'Contraseña actualizada'}), 200