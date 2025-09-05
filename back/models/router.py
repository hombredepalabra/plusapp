from datetime import datetime
from models import db
from .base import BaseModel


class Branch(BaseModel):
    """Modelo Branch basado en tabla 'branches'"""
    __tablename__ = 'branches'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    location = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relaciones
    routers = db.relationship('Router', back_populates='branch', lazy='dynamic')


class Router(BaseModel):
    """Modelo Router basado en tabla 'routers'"""
    __tablename__ = 'routers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    uri = db.Column(db.String(255), nullable=False)
    username = db.Column(db.String(100), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relaciones
    branch = db.relationship('Branch', back_populates='routers')
    user_routers = db.relationship('UserRouter', back_populates='router', lazy='dynamic')
    secrets = db.relationship('Secret', back_populates='router', lazy='dynamic')
    firewall_rules = db.relationship('RouterFirewall', back_populates='router', lazy='dynamic')
    secret_configs = db.relationship('RouterSecretConfig', back_populates='router', lazy='dynamic')
    activity_logs = db.relationship('ActivityLog', back_populates='router', lazy='dynamic')


class Secret(db.Model):
    """Modelo RouterSecret basado en tabla 'router_secrets'"""
    __tablename__ = 'router_secrets'
    
    id = db.Column(db.Integer, primary_key=True)
    router_id = db.Column(db.Integer, db.ForeignKey('routers.id'), nullable=False)
    ip_address = db.Column(db.String(20), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    comment = db.Column(db.String(255), nullable=True)
    profile = db.Column(db.String(255), nullable=True)
    contract = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relaciones
    router = db.relationship('Router', back_populates='secrets')


class RouterFirewall(db.Model):
    """Modelo RouterFirewall basado en tabla 'router_firewall'"""
    __tablename__ = 'router_firewall'

    router_id = db.Column(db.Integer, db.ForeignKey('routers.id'), primary_key=True)
    firewall_id = db.Column(db.String(50), primary_key=True)
    ip_address = db.Column(db.String(20), nullable=False)
    comment = db.Column(db.String(255), nullable=True)
    creation_date = db.Column(db.String(100), nullable=True)
    protocol = db.Column(db.String(20), nullable=True)
    port = db.Column(db.String(255), nullable=True)
    action = db.Column(db.String(20), nullable=True)
    chain = db.Column(db.String(20), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relaciones
    router = db.relationship('Router', back_populates='firewall_rules')


class RouterSecretConfig(db.Model):
    """Modelo RouterSecretConfig basado en tabla 'router_secret_configs'"""
    __tablename__ = 'router_secret_configs'
    
    router_id = db.Column(db.Integer, db.ForeignKey('routers.id'), primary_key=True)
    secret_id = db.Column(db.String(50), primary_key=True)
    ip_address = db.Column(db.String(20), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    comment = db.Column(db.String(255), nullable=True)
    profile = db.Column(db.String(255), nullable=True)
    profile_value = db.Column(db.String(100), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relaciones
    router = db.relationship('Router', back_populates='secret_configs')


class ActivityLog(db.Model):
    """Modelo ActivityLog basado en tabla 'activity_logs'"""
    __tablename__ = 'activity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    router_id = db.Column(db.Integer, db.ForeignKey('routers.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # Relaciones
    router = db.relationship('Router', back_populates='activity_logs')
    user = db.relationship('User', back_populates='activity_logs')