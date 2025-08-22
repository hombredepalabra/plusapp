from cryptography.fernet import Fernet
from flask import current_app
import base64

class EncryptionService:
    @staticmethod
    def get_key():
        """Obtiene clave de encriptación"""
        key = current_app.config.get('ENCRYPTION_KEY')
        if not key:
            key = Fernet.generate_key()
        return key
    
    @staticmethod
    def encrypt_password(password):
        """Encripta contraseña de router"""
        try:
            key = EncryptionService.get_key()
            f = Fernet(key)
            encrypted = f.encrypt(password.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
        except Exception as e:
            current_app.logger.error(f"Error encriptando: {e}")
            return password
    
    @staticmethod
    def decrypt_password(encrypted_password):
        """Desencripta contraseña de router"""
        try:
            key = EncryptionService.get_key()
            f = Fernet(key)
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_password.encode())
            decrypted = f.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception as e:
            current_app.logger.error(f"Error desencriptando: {e}")
            return encrypted_password