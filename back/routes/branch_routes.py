from flask import Blueprint
from controllers.branch_controller import BranchController
from middleware.auth_middleware import require_auth
from utils.decorators import handle_errors

branch_bp = Blueprint('branches', __name__, url_prefix='/api/branches')

@branch_bp.route('/', methods=['GET'])
@branch_bp.route('', methods=['GET'])
@require_auth
@handle_errors
def list_branches():
    """GET /api/branches - List all branches"""
    return BranchController.get_branches()

@branch_bp.route('/<int:branch_id>', methods=['GET'])
@require_auth
@handle_errors
def get_branch(branch_id: int):
    """GET /api/branches/{id} - Get specific branch"""
    return BranchController.get_branch(branch_id)

@branch_bp.route('/', methods=['POST'])
@require_auth
@handle_errors
def create_branch():
    """POST /api/branches - Create new branch"""
    return BranchController.create_branch()

@branch_bp.route('/<int:branch_id>', methods=['PUT'])
@require_auth
@handle_errors
def update_branch(branch_id: int):
    """PUT /api/branches/{id} - Update branch"""
    return BranchController.update_branch(branch_id)

@branch_bp.route('/<int:branch_id>', methods=['DELETE'])
@require_auth
@handle_errors
def delete_branch(branch_id: int):
    """DELETE /api/branches/{id} - Delete branch"""
    return BranchController.delete_branch(branch_id)