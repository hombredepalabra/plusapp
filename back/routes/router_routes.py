from flask import Blueprint
from controllers.router_controller import RouterController
from middleware.auth_middleware import require_auth
from utils.decorators import handle_errors

router_bp = Blueprint('routers', __name__, url_prefix='/api/routers')

@router_bp.route('/', methods=['GET'])
@router_bp.route('', methods=['GET'])
@require_auth
@handle_errors
def list_routers():
    """GET /api/routers - List all routers"""
    return RouterController.get_routers()

@router_bp.route('/<int:router_id>', methods=['GET'])
@require_auth
@handle_errors
def get_router(router_id: int):
    """GET /api/routers/{id} - Get specific router"""
    return RouterController.get_router(router_id)

@router_bp.route('/', methods=['POST'])
@require_auth
@handle_errors
def create_router():
    """POST /api/routers - Create new router"""
    return RouterController.create_router()

@router_bp.route('/<int:router_id>', methods=['PUT'])
@require_auth
@handle_errors
def update_router(router_id: int):
    """PUT /api/routers/{id} - Update router"""
    return RouterController.update_router(router_id)

@router_bp.route('/<int:router_id>', methods=['DELETE'])
@require_auth
@handle_errors
def delete_router(router_id: int):
    """DELETE /api/routers/{id} - Delete router"""
    return RouterController.delete_router(router_id)

@router_bp.route('/<int:router_id>/test', methods=['POST'])
@require_auth
@handle_errors
def test_connection(router_id: int):
    """POST /api/routers/{id}/test - Test router connectivity"""
    return RouterController.test_connection(router_id)

@router_bp.route('/<int:router_id>/status', methods=['GET'])
@require_auth
@handle_errors
def get_status(router_id: int):
    """GET /api/routers/{id}/status - Get router status"""
    return RouterController.get_status(router_id)
