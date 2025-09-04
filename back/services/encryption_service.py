"""Herramientas de encriptación para credenciales sensibles."""

import base64
import os

from cryptography.fernet import Fernet
from flask import current_app

class EncryptionService:
    @staticmethod
    def get_key():
        """Obtiene clave de encriptación persistente.

        La clave se obtiene desde la configuración de la aplicación. Si no
        existe, se intenta cargar desde la variable de entorno
        ``ENCRYPTION_KEY``.  Si aún así no está definida, se genera una nueva y
        se almacena en ``current_app.config`` para que permanezca durante el
        ciclo de vida del proceso.
        """

        key = current_app.config.get("ENCRYPTION_KEY")
        if not key:
            env_key = os.environ.get("ENCRYPTION_KEY")
            if env_key:
                key = env_key.encode() if isinstance(env_key, str) else env_key
            else:
                key = Fernet.generate_key()
            current_app.config["ENCRYPTION_KEY"] = key
        elif isinstance(key, str):
            key = key.encode()

        return key
    
    @staticmethod
    def encrypt_password(password):
        """Encripta contraseña de router"""
        try:
            key = EncryptionService.get_key()
            f = Fernet(key)
            encrypted = f.encrypt(password.encode())
            # ``Fernet.encrypt`` ya retorna un token en base64 seguro para
            # URLs, por lo que no es necesario codificarlo nuevamente.
            return encrypted.decode()
        except Exception as e:
            current_app.logger.error(f"Error encriptando: {e}")
            return password
    
    @staticmethod
    def decrypt_password(encrypted_password):
        """Desencripta contraseña de router"""
        try:
            key = EncryptionService.get_key()
            f = Fernet(key)
            decrypted = f.decrypt(encrypted_password.encode())
            return decrypted.decode()
        except Exception as e:
            current_app.logger.error(f"Error desencriptando: {e}")
            return encrypted_password

    @staticmethod
    def decrypt_password_legacy(encrypted_password: str) -> str:
        """Desencripta contraseñas almacenadas con el formato antiguo.

        Antes las contraseñas se codificaban dos veces en base64, lo que
        producía cadenas más largas.  Este método permite migrarlas al nuevo
        formato.
        """

        try:
            key = EncryptionService.get_key()
            f = Fernet(key)
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_password.encode())
            decrypted = f.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception as e:  # pragma: no cover - solo usado en migraciones
            current_app.logger.error(f"Error desencriptando (legacy): {e}")
            return encrypted_password