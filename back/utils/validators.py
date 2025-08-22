import re
from flask import jsonify

def validate_email(email):
    """Valida formato de email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Valida fortaleza de contraseña"""
    if len(password) < 8:
        return False, "La contraseña debe tener al menos 8 caracteres"
    
    if not re.search(r'[A-Z]', password):
        return False, "La contraseña debe tener al menos una mayúscula"
    
    if not re.search(r'[a-z]', password):
        return False, "La contraseña debe tener al menos una minúscula"
    
    if not re.search(r'\d', password):
        return False, "La contraseña debe tener al menos un número"
    
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