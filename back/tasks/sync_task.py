from celery import Celery
from services.sync_service import SyncService
from models.router import Router

def create_celery_app():
    """Crea instancia de Celery"""
    celery = Celery('plus_app')
    celery.conf.update(
        broker_url='redis://localhost:6379/0',
        result_backend='redis://localhost:6379/0',
        task_serializer='json',
        accept_content=['json'],
        result_serializer='json',
        timezone='UTC',
        enable_utc=True,
    )
    return celery

celery = create_celery_app()

@celery.task
def sync_all_routers_task():
    """Schedule synchronization of all active routers.

    Each router is dispatched as an individual Celery task with a
    small delay to avoid overloading either the application or the
    routers themselves.  Results are reported by the subtasks.
    """

    try:
        routers = Router.query.filter_by(is_active=True).all()
        for index, router in enumerate(routers):
            # Stagger execution by 10 seconds per router
            sync_single_router_task.apply_async(args=[router.id], countdown=index * 10)

        return {
            'status': 'scheduled',
            'total': len(routers),
        }
    except Exception as e:  # pragma: no cover - best effort
        return {'status': 'error', 'message': str(e)}

@celery.task
def sync_single_router_task(router_id):
    """Tarea de sincronización de un router específico"""
    try:
        success, message = SyncService.sync_router(router_id, 'scheduled')
        return {
            'status': 'completed' if success else 'error',
            'router_id': router_id,
            'message': message
        }
    except Exception as e:
        return {
            'status': 'error',
            'router_id': router_id,
            'message': str(e)
        }

# Configurar tareas periódicas
celery.conf.beat_schedule = {
    'sync-routers-every-15-minutes': {
        'task': 'app.tasks.sync_task.sync_all_routers_task',
        'schedule': 900.0,  # 15 minutos en segundos
    },
}
