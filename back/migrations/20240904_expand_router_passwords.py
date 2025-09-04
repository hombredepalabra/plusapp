"""Migration para ampliar columna de contraseñas y re-encriptar datos existentes."""

from sqlalchemy import text
from models import db
from models.router import Router
from services.encryption_service import EncryptionService


def run():
    """Ejecuta la migración."""
    # Aumentar el tamaño de la columna en la base de datos
    with db.engine.connect() as conn:
        conn.execute(text("ALTER TABLE routers ALTER COLUMN password TYPE VARCHAR(255);"))

    # Re-encriptar contraseñas existentes que usaban el formato antiguo
    routers = Router.query.all()
    for router in routers:
        try:
            plain = EncryptionService.decrypt_password_legacy(router.password)
            router.password = EncryptionService.encrypt_password(plain)
        except Exception:
            # Si no se puede desencriptar, se deja el valor tal cual
            continue
    db.session.commit()
