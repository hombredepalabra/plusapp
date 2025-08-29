import re
from flask import jsonify

def validate_email(email):
    """Valida formato de email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Valida fortaleza de contraseña según OWASP"""
    common_passwords = [
        'password', 'admin', 'administrator', 'root', 'user', 'guest', 'test',
        '123456', '123456789', 'qwerty', 'abc123', 'password123', 'admin123',
        'welcome', 'monkey', 'dragon', 'master', 'superman', 'football', 
        'baseball', 'princess'
    ]
    
    # Longitud mínima OWASP
    if len(password) < 12:
        return False, "La contraseña debe tener al menos 12 caracteres"
    
    # Verificar contraseñas comunes
    if password.lower() in common_passwords:
        return False, "La contraseña es muy común, elige una más segura"
    
    # Verificar patrones débiles
    if re.search(r'(.)\1{3,}', password):  # 4+ caracteres repetidos
        return False, "La contraseña no puede tener 4 o más caracteres repetidos"
    
    if re.search(r'(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def)', password.lower()):
        return False, "La contraseña no puede contener secuencias obvias"
    
    # Verificar que no sea solo el username + números
    if re.match(r'^[a-zA-Z]+\d+$', password) and len(password) <= 15:
        return False, "La contraseña no puede ser solo nombre + números"
    
    # Requisitos de complejidad
    if not re.search(r'[A-Z]', password):
        return False, "La contraseña debe tener al menos una mayúscula"
    
    if not re.search(r'[a-z]', password):
        return False, "La contraseña debe tener al menos una minúscula"
    
    if not re.search(r'\d', password):
        return False, "La contraseña debe tener al menos un número"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "La contraseña debe tener al menos un símbolo (!@#$%^&*(),.?\":{}|<>)"
    
    return True, "Contraseña válida"

def validate_ip_address(ip):
    """Valida formato de dirección IP"""
    pattern = r'^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
    return re.match(pattern, ip) is not None

def validate_required_fields(data, required_fields):
    """Valida campos requeridos"""
    missing_fields = []
    for field in required_fields:
        if field not in data or not data[field]:
            missing_fields.append(field)
    
    if missing_fields:
        return False, f"Campos requeridos faltantes: {', '.join(missing_fields)}"
    
    return True, "Validación exitosa"