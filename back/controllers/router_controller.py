from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.router import Router, Branch
from models.user import User
from services.mikrotik_service import MikroTikService
from services.encryption_service import EncryptionService

class RouterController:
    @staticmethod
    @jwt_required()
    def get_routers():
        """GET /api/routers - Listar todos los routers"""
        routers = Router.query.filter_by(is_active=True).all()
        return jsonify([{
            'id': r.id,
            'name': r.name,
            'uri': r.uri,
            'username': r.username,
            'branch_id': r.branch_id,
            'is_active': r.is_active,
            'created_at': r.created_at.isoformat() if r.created_at else None
        } for r in routers]), 200
    
    @staticmethod
    @jwt_required()
    def get_router(router_id):
        """GET /api/routers/{id} - Obtener router específico"""
        router = Router.query.get_or_404(router_id)
        return jsonify({
            'id': router.id,
            'name': router.name,
            'uri': router.uri,
            'username': router.username,
            'branch_id': router.branch_id,
            'is_active': router.is_active,
            'created_at': router.created_at.isoformat() if router.created_at else None
        }), 200
    
    @staticmethod
    @jwt_required()
    def create_router():
        """POST /api/routers - Agregar nuevo router"""
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if current_user.role not in ['admin', 'manager']:
            return jsonify({'error': 'Acceso denegado'}), 403
        
        data = request.get_json()
        
        # Validar que la branch existe
        branch = Branch.query.get(data['branch_id'])
        if not branch:
            return jsonify({'error': 'Sucursal no encontrada'}), 404
        
        # Encriptar contraseña
        encrypted_password = EncryptionService.encrypt_password(data['password'])
        
        router = Router(
            name=data['name'],
            uri=data['uri'],
            username=data['username'],
            password=encrypted_password,
            branch_id=data['branch_id']
        )
        
        db.session.add(router)
        db.session.commit()
        
        return jsonify({
            'id': router.id,
            'message': 'Router creado exitosamente'
        }), 201
    
    @staticmethod
    @jwt_required()
    def update_router(router_id):
        """PUT /api/routers/{id} - Actualizar router"""
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if current_user.role not in ['admin', 'manager']:
            return jsonify({'error': 'Acceso denegado'}), 403
        
        router = Router.query.get_or_404(router_id)
        data = request.get_json()
        
        router.name = data.get('name', router.name)
        router.uri = data.get('uri', router.uri)
        router.username = data.get('username', router.username)
        
        if 'password' in data:
            router.password = EncryptionService.encrypt_password(data['password'])
        
        router.branch_id = data.get('branch_id', router.branch_id)
        
        db.session.commit()
        return jsonify({'message': 'Router actualizado'}), 200
    
    @staticmethod
    @jwt_required()
    def delete_router(router_id):
        """DELETE /api/routers/{id} - Eliminar router"""
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if current_user.role not in ['admin', 'manager']:
            return jsonify({'error': 'Acceso denegado'}), 403
        
        router = Router.query.get_or_404(router_id)
        router.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Router eliminado'}), 200
    
    @staticmethod
    @jwt_required()
    def test_connection(router_id):
        """POST /api/routers/{id}/test - Probar conexión al router"""
        router = Router.query.get_or_404(router_id)
        
        # Desencriptar contraseña para la conexión
        decrypted_password = EncryptionService.decrypt_password(router.password)
        test_router = type('obj', (object,), {
            'uri': router.uri,
            'username': router.username,
            'password': decrypted_password
        })
        
        success, message = MikroTikService.test_connection(test_router)
        
        return jsonify({
            'success': success,
            'message': message
        }), 200
    
    @staticmethod
    @jwt_required()
    def get_status(router_id):
        """GET /api/routers/{id}/status - Estado del router"""
        router = Router.query.get_or_404(router_id)
        
        # Probar conexión para obtener estado actual
        decrypted_password = EncryptionService.decrypt_password(router.password)
        test_router = type('obj', (object,), {
            'uri': router.uri,
            'username': router.username,
            'password': decrypted_password
        })
        
        connected, _ = MikroTikService.test_connection(test_router)
        status = 'online' if connected else 'offline'
        
        return jsonify({
            'router_id': router.id,
            'status': status,
            'last_check': router.updated_at.isoformat() if router.updated_at else None
        }), 200