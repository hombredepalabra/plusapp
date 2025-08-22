from flask import Blueprint
from controllers.firewall_controller import FirewallController
from middleware.auth_middleware import require_auth
from utils.decorators import handle_errors

firewall_bp = Blueprint('firewall', __name__, url_prefix='/api/firewall')

@firewall_bp.route('/rules', methods=['GET'])
@require_auth
@handle_errors
def get_rules():
    """GET /api/firewall/rules - Lista de reglas"""
    return FirewallController.get_rules()

@firewall_bp.route('/block-ip', methods=['POST'])
@require_auth
@handle_errors
def block_ip():
    """POST /api/firewall/block-ip - Bloquear IP"""
    return FirewallController.block_ip()

@firewall_bp.route('/unblock-ip', methods=['DELETE'])
@require_auth
@handle_errors
def unblock_ip():
    """DELETE /api/firewall/unblock-ip - Desbloquear IP"""
    return FirewallController.unblock_ip()
