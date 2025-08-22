from flask import Blueprint
from controllers.sync_controller import SyncController

sync_bp = Blueprint('sync', __name__, url_prefix='/api/sync')

sync_bp.add_url_rule('/manual/<int:router_id>', 'manual_sync_router', SyncController.manual_sync_router, methods=['POST'])
sync_bp.add_url_rule('/all', 'sync_all', SyncController.sync_all, methods=['POST'])
sync_bp.add_url_rule('/status', 'get_sync_status', SyncController.get_sync_status, methods=['GET'])
sync_bp.add_url_rule('/logs', 'get_sync_logs', SyncController.get_sync_logs, methods=['GET'])
sync_bp.add_url_rule('/history', 'get_sync_history', SyncController.get_sync_history, methods=['GET'])