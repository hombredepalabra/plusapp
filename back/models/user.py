from datetime import datetime, timedelta
import bcrypt
import pyotp
import secrets
import json
from models import db
from .base import BaseModel


class User(BaseModel):
    """Modelo Usuario basado en tabla 'users' del schema.sql"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, unique=True, index=True)
    email = db.Column(db.String(120), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(128), nullable=False)
    
    # Campos 2FA
    totp_secret = db.Column(db.String(32), nullable=True)
    two_factor_enabled = db.Column(db.Boolean, default=False)
    backup_codes = db.Column(db.Text, nullable=True)  # JSON string de códigos hasheados
    
    # Campos de seguridad
    failed_login_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime, nullable=True)
    last_login = db.Column(db.DateTime, nullable=True)
    password_changed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Campos de reseteo
    reset_token = db.Column(db.String(64), nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)
    
    # Atributos de rol y permisos
    role = db.Column(db.String(50), default='user')  # admin, supervisor, operator, user, guest, manager
    permissions = db.Column(db.Text, nullable=True)  # JSON string con permisos específicos
    is_active = db.Column(db.Boolean, default=True)
    
    # Relaciones con otras tablas
    user_routers = db.relationship('UserRouter', back_populates='user', lazy='dynamic', foreign_keys='UserRouter.user_id')

    activity_logs = db.relationship('ActivityLog', back_populates='user', lazy='dynamic')
    auth_logs = db.relationship('AuthLog', back_populates='user', lazy='dynamic')
    security_events = db.relationship('SecurityEvent', back_populates='user', lazy='dynamic')
    
    def set_password(self, password):
        """Establece contraseña con hash bcrypt"""
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        self.password_changed_at = datetime.utcnow()
    
    def check_password(self, password):
        """Verifica contraseña"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def generate_totp_secret(self):
        """Genera secreto TOTP"""
        self.totp_secret = pyotp.random_base32()
        return self.totp_secret
    
    def verify_totp(self, token):
        """Verifica código TOTP"""
        if not self.totp_secret:
            return False
        totp = pyotp.TOTP(self.totp_secret)
        return totp.verify(token)
    
    def get_totp_uri(self, issuer_name="PLUS App"):
        """URI para código QR"""
        if self.totp_secret:
            return pyotp.totp.TOTP(self.totp_secret).provisioning_uri(
                name=self.email, 
                issuer_name=issuer_name
            )
        return None
    
    def generate_backup_codes(self, count=8):
        """Genera códigos de respaldo para 2FA"""
        codes = []
        hashed_codes = []
        
        for _ in range(count):
            # Generar código de 8 dígitos
            code = ''.join([str(secrets.randbelow(10)) for _ in range(8)])
            codes.append(code)
            # Hashear para almacenamiento seguro
            hashed_codes.append(bcrypt.hashpw(code.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'))
        
        # Guardar códigos hasheados en JSON
        self.backup_codes = json.dumps(hashed_codes)
        return codes  # Devolver códigos en texto plano solo una vez
    
    def verify_backup_code(self, code):
        """Verifica y consume un código de respaldo"""
        if not self.backup_codes:
            return False
        
        try:
            stored_codes = json.loads(self.backup_codes)
            for i, hashed_code in enumerate(stored_codes):
                if bcrypt.checkpw(code.encode('utf-8'), hashed_code.encode('utf-8')):
                    # Remover código usado
                    stored_codes.pop(i)
                    self.backup_codes = json.dumps(stored_codes)
                    return True
        except (json.JSONDecodeError, AttributeError):
            return False
        
        return False
    
    def is_locked(self):
        """Verifica si la cuenta está bloqueada"""
        if self.locked_until:
            if datetime.utcnow() < self.locked_until:
                return True
            else:
                # Desbloquear cuenta automáticamente
                self.locked_until = None
                self.failed_login_attempts = 0
                return False
        return False
    
    def lock_account(self, duration_minutes=15):
        """Bloquea la cuenta por un período específico"""
        self.locked_until = datetime.utcnow() + timedelta(minutes=duration_minutes)
    
    def reset_failed_attempts(self):
        """Resetea intentos fallidos y actualiza último login"""
        self.failed_login_attempts = 0
        self.locked_until = None
        self.last_login = datetime.utcnow()
    
    def generate_reset_token(self):
        """Genera token para reseteo de contraseña"""
        self.reset_token = secrets.token_urlsafe(32)
        self.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        return self.reset_token
    
    def is_admin(self):
        """Verifica si el usuario es administrador"""
        return self.role == 'admin'
    
    def is_supervisor(self):
        """Verifica si el usuario es supervisor"""
        return self.role in ['admin', 'supervisor']
    
    def can_access_router(self, router_id):
        """Verifica si el usuario puede acceder a un router específico"""
        if self.is_admin():
            return True
        
        # Verificar acceso directo en user_routers
        access = UserRouter.query.filter_by(
            user_id=self.id, 
            router_id=router_id
        ).first()
        
        return access is not None
    
    def get_permissions(self):
        """Obtiene permisos del usuario como dict"""
        if not self.permissions:
            return {}
        
        try:
            return json.loads(self.permissions)
        except (json.JSONDecodeError, TypeError):
            return {}
    
    def set_permissions(self, permissions_dict):
        """Establece permisos del usuario"""
        self.permissions = json.dumps(permissions_dict)
    
    def has_permission(self, permission):
        """Verifica si el usuario tiene un permiso específico"""
        if self.is_admin():
            return True
        
        permissions = self.get_permissions()
        return permissions.get(permission, False)
    
    def to_dict(self):
        """Convierte el usuario a diccionario para JSON"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'two_factor_enabled': self.two_factor_enabled,
            'is_active': self.is_active,
            'last_login': self.last_login.isoformat() + 'Z' if self.last_login else None,
            'created_at': self.created_at.isoformat() + 'Z',
            'updated_at': self.updated_at.isoformat() + 'Z'
        }


class UserRouter(db.Model):
    """Tabla de relación users-routers"""
    __tablename__ = 'user_routers'
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    router_id = db.Column(db.Integer, db.ForeignKey('routers.id'), primary_key=True)
    access_level = db.Column(db.String(20), default='read')  # read, write, admin, full
    is_group_member = db.Column(db.Boolean, default=False)
    granted_at = db.Column(db.DateTime, default=datetime.utcnow)
    granted_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Relaciones
    user = db.relationship('User', back_populates='user_routers', foreign_keys=[user_id])
    router = db.relationship('Router', back_populates='user_routers')
    granted_by_user = db.relationship('User', foreign_keys=[granted_by])


class AuthLog(db.Model):
    """Logs de autenticación"""
    __tablename__ = 'auth_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    username = db.Column(db.String(80), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    
    # Información del evento
    event_type = db.Column(db.String(50), nullable=False)  # login, logout, 2fa_setup, etc.
    success = db.Column(db.Boolean, nullable=False)
    failure_reason = db.Column(db.String(200), nullable=True)
    
    # Información de la sesión
    ip_address = db.Column(db.String(45), nullable=True)  # IPv6 compatible
    user_agent = db.Column(db.Text, nullable=True)
    session_id = db.Column(db.String(128), nullable=True)
    
    # Información 2FA
    two_factor_used = db.Column(db.Boolean, default=False)
    backup_code_used = db.Column(db.Boolean, default=False)
    
    # Timestamp
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # Relaciones
    user = db.relationship('User', back_populates='auth_logs')
    
    @staticmethod
    def log_event(user_id=None, username=None, email=None, event_type=None, 
                 success=True, failure_reason=None, ip_address=None, 
                 user_agent=None, two_factor_used=False, backup_code_used=False):
        """Método estático para crear logs de autenticación"""
        log_entry = AuthLog(
            user_id=user_id,
            username=username,
            email=email,
            event_type=event_type,
            success=success,
            failure_reason=failure_reason,
            ip_address=ip_address,
            user_agent=user_agent,
            two_factor_used=two_factor_used,
            backup_code_used=backup_code_used
        )
        
        db.session.add(log_entry)
        db.session.commit()
        return log_entry


class SecurityEvent(db.Model):
    """Eventos de seguridad"""
    __tablename__ = 'security_events'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    event_type = db.Column(db.String(50), nullable=False)  # account_locked, password_changed, etc.
    description = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(20), nullable=False)  # low, medium, high, critical
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # Relaciones
    user = db.relationship('User', back_populates='security_events')
    
    @staticmethod
    def log_security_event(user_id=None, event_type=None, description=None, 
                          severity='medium', ip_address=None, user_agent=None):
        """Método estático para crear eventos de seguridad"""
        event = SecurityEvent(
            user_id=user_id,
            event_type=event_type,
            description=description,
            severity=severity,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.session.add(event)
        db.session.commit()
        return event