class PlusAppException(Exception):
    """Excepción base para la aplicación"""
    def __init__(self, message, status_code=500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

class ValidationError(PlusAppException):
    """Error de validación"""
    def __init__(self, message):
        super().__init__(message, 400)

class AuthenticationError(PlusAppException):
    """Error de autenticación"""
    def __init__(self, message):
        super().__init__(message, 401)

class AuthorizationError(PlusAppException):
    """Error de autorización"""
    def __init__(self, message):
        super().__init__(message, 403)

class NotFoundError(PlusAppException):
    """Error de recurso no encontrado"""
    def __init__(self, message):
        super().__init__(message, 404)

class MikroTikConnectionError(PlusAppException):
    """Error de conexión MikroTik"""
    def __init__(self, message):
        super().__init__(message, 502)