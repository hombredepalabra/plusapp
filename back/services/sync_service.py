from datetime import datetime
from models import db
from models.router import Router, Secret
from models.sync_log import SyncLog
from services.mikrotik_service import MikroTikService

class SyncService:
    @staticmethod
    def sync_router(router_id, sync_type='manual'):
        """Sincroniza un router específico"""
        router = Router.query.get(router_id)
        if not router:
            return False, "Router no encontrado"
        
        # Crear log de sincronización
        sync_log = SyncLog(
            router_id=router_id,
            sync_type=sync_type,
            status='running'
        )
        db.session.add(sync_log)
        db.session.commit()
        
        start_time = datetime.utcnow()
        
        try:
            # Probar conexión
            connected, message = MikroTikService.test_connection(router)
            if not connected:
                sync_log.status = 'error'
                sync_log.message = f"Error de conexión: {message}"
                sync_log.completed_at = datetime.utcnow()
                db.session.commit()
                return False, f"Error de conexión: {message}"

            # Obtener secrets del router
            secrets, error = MikroTikService.get_pppoe_secrets(router)
            if error:
                sync_log.status = 'error'
                sync_log.message = f"Error obteniendo secrets: {error}"
                sync_log.completed_at = datetime.utcnow()
                db.session.commit()
                return False, f"Error obteniendo secrets: {error}"

            # Reemplazar los registros existentes por los nuevos
            Secret.query.filter_by(router_id=router_id).delete()
            db.session.commit()

            synced_count = 0
            for secret in secrets or []:
                new_secret = Secret(
                    router_id=router_id,
                    ip_address=secret.get('local-address', ''),
                    name=secret.get('name', ''),
                    password=secret.get('password', ''),
                    comment=secret.get('comment', ''),
                    profile=secret.get('profile', ''),
                    contract=secret.get('comment', ''),
                )
                db.session.add(new_secret)
                synced_count += 1

            # Completar log
            end_time = datetime.utcnow()
            sync_log.status = 'success'
            sync_log.message = f"Sincronizados {synced_count} secrets"
            sync_log.records_synced = synced_count
            sync_log.duration_seconds = (end_time - start_time).total_seconds()
            sync_log.completed_at = end_time

            db.session.commit()

            return True, f"Sincronizados {synced_count} secrets"

        except Exception as e:
            sync_log.status = 'error'
            sync_log.message = str(e)
            sync_log.completed_at = datetime.utcnow()
            db.session.commit()
            return False, str(e)
    
    @staticmethod
    def sync_all_routers():
        """Sincroniza todos los routers activos"""
        routers = Router.query.filter_by(is_active=True).all()
        results = []
        
        for router in routers:
            success, message = SyncService.sync_router(router.id, 'bulk')
            results.append({
                'router_id': router.id,
                'router_name': router.name,
                'success': success,
                'message': message
            })
        
        return results
    
    @staticmethod
    def get_sync_history(router_id=None, limit=50):
        """Obtiene historial de sincronizaciones"""
        query = SyncLog.query
        
        if router_id:
            query = query.filter_by(router_id=router_id)
        
        logs = query.order_by(SyncLog.started_at.desc()).limit(limit).all()
        return [log.to_dict() for log in logs]
