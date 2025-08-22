from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from models.router import Router
from services.sync_service import SyncService

class SyncController:
    @staticmethod
    @jwt_required()
    def manual_sync_router(router_id):
        """POST /api/sync/manual/{router_id} - Sincronización manual de un router"""
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if current_user.role not in ['admin', 'manager', 'operator']:
            return jsonify({'error': 'Acceso denegado'}), 403
        
        success, message = SyncService.sync_router(router_id, 'manual')
        return jsonify({
            'success': success,
            'message': message,
            'router_id': router_id
        }), 200 if success else 400
    
    @staticmethod
    @jwt_required()
    def sync_all():
        """POST /api/sync/all - Sincronización manual de todos"""
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if current_user.role not in ['admin', 'manager']:
            return jsonify({'error': 'Acceso denegado'}), 403
        
        results = SyncService.sync_all_routers()
        successful = len([r for r in results if r['success']])
        
        return jsonify({
            'results': results,
            'total': len(results),
            'successful': successful,
            'failed': len(results) - successful
        }), 200
    
    @staticmethod
    @jwt_required()
    def get_sync_status():
        """GET /api/sync/status - Estado de la última sincronización"""
        routers = Router.query.filter_by(is_active=True).all()
        
        status_list = []
        for router in routers:
            # Obtener último log de sincronización
            last_sync = SyncService.get_sync_history(router.id, 1)
            
            status_list.append({
                'router_id': router.id,
                'router_name': router.name,
                'last_sync': last_sync[0] if last_sync else None,
                'is_active': router.is_active
            })
        
        return jsonify(status_list), 200
    
    @staticmethod
    @jwt_required()
    def get_sync_logs():
        """GET /api/sync/logs - Logs de sincronización"""
        router_id = request.args.get('router_id', type=int)
        limit = request.args.get('limit', 50, type=int)
        
        logs = SyncService.get_sync_history(router_id, limit)
        return jsonify(logs), 200
    
    @staticmethod
    @jwt_required()
    def get_sync_history():
        """GET /api/sync/history - Historial de sincronizaciones"""
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        router_id = request.args.get('router_id', type=int)
        
        # Calcular offset
        offset = (page - 1) * per_page
        
        # Obtener historial con paginación manual
        all_logs = SyncService.get_sync_history(router_id, offset + per_page)
        logs = all_logs[offset:offset + per_page]
        
        return jsonify({
            'logs': logs,
            'page': page,
            'per_page': per_page,
            'total': len(all_logs)
        }), 200