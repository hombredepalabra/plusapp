from flask import Blueprint, request, jsonify
from controllers.pppoe_controller import PPPoEController
from middleware.auth_middleware import require_auth
from utils.decorators import handle_errors

pppoe_bp = Blueprint('pppoe', __name__, url_prefix='/api/pppoe')

# ==================== CRUD ====================

@pppoe_bp.route('/clients', methods=['GET'])
@require_auth
@handle_errors
def get_all_clients():
    """GET /api/pppoe/clients - Listar todos los clientes"""
    return PPPoEController.get_all_clients()

@pppoe_bp.route('/clients', methods=['POST'])
@require_auth
@handle_errors
def create_client():
    """POST /api/pppoe/clients - Crear nuevo cliente"""
    return PPPoEController.create_client()

@pppoe_bp.route('/routers/<int:router_id>/clients', methods=['GET'])
@require_auth
@handle_errors
def get_clients_by_router(router_id):
    """GET /api/pppoe/routers/{router_id}/clients - Clientes de un router específico"""
    return PPPoEController.get_clients_by_router(router_id)

@pppoe_bp.route('/clients/search', methods=['GET'])
@require_auth
@handle_errors
def search_clients():
    """GET /api/pppoe/clients/search?q={query} - Buscar clientes por nombre"""
    return PPPoEController.search_clients()

@pppoe_bp.route('/clients/<int:client_id>', methods=['GET'])
@require_auth
@handle_errors
def get_client(client_id):
    """GET /api/pppoe/clients/{id} - Obtener cliente específico"""
    return PPPoEController.get_client(client_id)

@pppoe_bp.route('/clients/<int:client_id>', methods=['PUT'])
@require_auth
@handle_errors
def update_client(client_id):
    """PUT /api/pppoe/clients/{id} - Actualizar cliente completo"""
    return PPPoEController.update_client(client_id)

@pppoe_bp.route('/clients/<int:client_id>', methods=['PATCH'])
@require_auth
@handle_errors
def patch_client(client_id):
    """PATCH /api/pppoe/clients/{id} - Actualización parcial"""
    return PPPoEController.patch_client(client_id)

@pppoe_bp.route('/clients/<int:client_id>', methods=['DELETE'])
@require_auth
@handle_errors
def delete_client(client_id):
    """DELETE /api/pppoe/clients/{id} - Eliminar cliente"""
    return PPPoEController.delete_client(client_id)

@pppoe_bp.route('/clients/<int:client_id>/status', methods=['PUT'])
@require_auth
@handle_errors
def change_client_status(client_id):
    """PUT /api/pppoe/clients/{id}/status - Cambiar estado (activar/suspender/desconectar)"""
    return PPPoEController.change_client_status(client_id)

@pppoe_bp.route('/clients/<int:client_id>/sessions', methods=['GET'])
@require_auth
@handle_errors
def get_client_sessions(client_id):
    """GET /api/pppoe/clients/{id}/sessions - Sesiones activas del cliente"""
    return PPPoEController.get_client_sessions(client_id)

@pppoe_bp.route('/clients/<int:client_id>/sessions', methods=['DELETE'])
@require_auth
@handle_errors
def disconnect_client_sessions(client_id):
    """DELETE /api/pppoe/clients/{id}/sessions - Desconectar todas las sesiones"""
    return PPPoEController.disconnect_client_sessions(client_id)

@pppoe_bp.route('/clients/<int:client_id>/reset-password', methods=['POST'])
@require_auth
@handle_errors
def reset_client_password(client_id):
    """POST /api/pppoe/clients/{id}/reset-password - Resetear contraseña del cliente"""
    return PPPoEController.reset_client_password(client_id)

@pppoe_bp.route('/clients/<int:client_id>/stats', methods=['GET'])
@require_auth
@handle_errors
def get_client_stats(client_id):
    """GET /api/pppoe/clients/{id}/stats - Estadísticas del cliente"""
    return PPPoEController.get_client_stats(client_id)

@pppoe_bp.route('/clients/<int:client_id>/logs', methods=['GET'])
@require_auth
@handle_errors
def get_client_logs(client_id):
    """GET /api/pppoe/clients/{id}/logs - Logs de conexión del cliente"""
    return PPPoEController.get_client_logs(client_id)

@pppoe_bp.route('/test', methods=['GET'])
def test_endpoint():
    """Endpoint de prueba sin autenticación"""
    return jsonify({'message': 'PPPoE endpoints funcionando', 'status': 'ok'}), 200