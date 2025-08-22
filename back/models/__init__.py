from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Importar todos los modelos para que SQLAlchemy los registre
from .user import User, UserRouter, AuthLog, SecurityEvent
from .router import Router, Branch, Secret, RouterFirewall, RouterSecretConfig, ActivityLog
