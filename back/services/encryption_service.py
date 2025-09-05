import base64
import os
from cryptography.fernet import Fernet
from flask import current_app

class EncryptionService:
    @staticmethod
    def get_key():
        """Obtiene clave de encriptación persistente."""
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
        """Desencripta contraseñas almacenadas con el formato antiguo."""

        try:
            key = EncryptionService.get_key()
            f = Fernet(key)
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_password.encode())
            decrypted = f.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception as e:
            current_app.logger.error(f"Error desencriptando (legacy): {e}")
            return encrypted_password