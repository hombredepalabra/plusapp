from models import db 

class SyncLog(db.Model):
    """Modelo SyncLog para logs de sincronización"""
    __tablename__ = 'sync_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    router_id = db.Column(db.Integer, db.ForeignKey('routers.id'), nullable=True)
    sync_type = db.Column(db.String(50), nullable=False)  # manual, automatic, scheduled
    status = db.Column(db.String(20), nullable=False)  # success, error, partial
    message = db.Column(db.Text, nullable=True)
    records_synced = db.Column(db.Integer, default=0)
    duration_seconds = db.Column(db.Float, nullable=True)
    started_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    completed_at = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        """Convierte a diccionario"""
        return {
            'id': self.id,
            'router_id': self.router_id,
            'sync_type': self.sync_type,
            'status': self.status,
            'message': self.message,
            'records_synced': self.records_synced,
            'duration_seconds': self.duration_seconds,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }