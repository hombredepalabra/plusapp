from datetime import datetime, timedelta
from celery import Celery
from config.database import db
from models.router import AuthLog, SecurityEvent, ActivityLog
from models.sync_log import SyncLog

celery = Celery('plus_app')

@celery.task
def cleanup_old_logs():
    """Limpia logs antiguos (más de 90 días)"""
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=90)
        
        # Limpiar auth logs
        auth_deleted = AuthLog.query.filter(
            AuthLog.timestamp < cutoff_date
        ).delete()
        
        # Limpiar security events
        security_deleted = SecurityEvent.query.filter(
            SecurityEvent.timestamp < cutoff_date
        ).delete()
        
        # Limpiar activity logs
        activity_deleted = ActivityLog.query.filter(
            ActivityLog.created_at < cutoff_date
        ).delete()
        
        # Limpiar sync logs
        sync_deleted = SyncLog.query.filter(
            SyncLog.started_at < cutoff_date
        ).delete()
        
        db.session.commit()
        
        return {
            'status': 'completed',
            'deleted': {
                'auth_logs': auth_deleted,
                'security_events': security_deleted,
                'activity_logs': activity_deleted,
                'sync_logs': sync_deleted
            },
            'total_deleted': auth_deleted + security_deleted + activity_deleted + sync_deleted
        }
    except Exception as e:
        db.session.rollback()
        return {
            'status': 'error',
            'message': str(e)
        }

@celery.task
def cleanup_inactive_users():
    """Limpia usuarios inactivos por más de 1 año"""
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=365)
        
        from models.user import User
        inactive_users = User.query.filter(
            User.last_login < cutoff_date,
            User.is_active == False
        ).count()
        
        # En lugar de eliminar, marcar como archivados
        User.query.filter(
            User.last_login < cutoff_date,
            User.is_active == False
        ).update({'role': 'archived'})
        
        db.session.commit()
        
        return {
            'status': 'completed',
            'archived_users': inactive_users
        }
    except Exception as e:
        db.session.rollback()
        return {
            'status': 'error',
            'message': str(e)
        }

# Configurar tareas de limpieza
celery.conf.beat_schedule.update({
    'cleanup-logs-daily': {
        'task': 'app.tasks.cleanup_task.cleanup_old_logs',
        'schedule': 86400.0,  # 24 horas
    },
    'cleanup-users-weekly': {
        'task': 'app.tasks.cleanup_task.cleanup_inactive_users',
        'schedule': 604800.0,  # 7 días
    },
})