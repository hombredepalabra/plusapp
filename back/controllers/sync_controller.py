from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from models.router import Router
from services.sync_service import SyncService
from utils.response import success_response, error_response
from datetime import datetime

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
        """GET /api/sync/status - Estado de la sincronización"""
        try:
            routers = Router.query.filter_by(is_active=True).all()
            total_routers = len(routers)
            
            # Mock data for now - would be replaced with actual sync service data
            status = {
                'is_running': False,
                'last_sync': datetime.now().isoformat() if total_routers > 0 else None,
                'next_sync': None,  # Would be calculated based on schedule
                'success_count': total_routers,  # Mock: assume all successful
                'error_count': 0,  # Mock: no errors
                'total_routers': total_routers
            }
            
            return success_response({'status': status})
            
        except Exception as e:
            return error_response(f"Error fetching sync status: {str(e)}", 500)
    
    @staticmethod
    @jwt_required()
    def get_sync_logs():
        """GET /api/sync/logs - Logs de sincronización"""
        try:
            router_id = request.args.get('router_id', type=int)
            limit = request.args.get('limit', 20, type=int)
            
            # Mock data for now - would be replaced with actual sync service data
            logs = []
            routers = Router.query.filter_by(is_active=True).limit(limit).all()
            
            for i, router in enumerate(routers):
                logs.append({
                    'id': i + 1,
                    'router_id': router.id,
                    'router_name': router.name,
                    'status': 'success',  # Mock: assume successful
                    'message': f'Sincronización exitosa para {router.name}',
                    'duration': 1500,  # Mock: 1.5 seconds
                    'timestamp': datetime.now().isoformat()
                })
            
            return success_response({'logs': logs})
            
        except Exception as e:
            return error_response(f"Error fetching sync logs: {str(e)}", 500)
    
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