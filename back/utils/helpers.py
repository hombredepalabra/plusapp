from datetime import datetime, timedelta
import secrets
import string
from models import db

def generate_random_string(length=32):
    """Genera string aleatorio"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def format_datetime(dt):
    """Formatea datetime para JSON"""
    if dt:
        return dt.isoformat()
    return None

def calculate_uptime(start_time):
    """Calcula uptime desde un tiempo inicial"""
    if not start_time:
        return None
    
    delta = datetime.utcnow() - start_time
    days = delta.days
    hours, remainder = divmod(delta.seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    
    return {
        'days': days,
        'hours': hours,
        'minutes': minutes,
        'seconds': seconds,
        'total_seconds': delta.total_seconds()
    }

def paginate_query(stmt, page, per_page):
    """Pagina una consulta de SQLAlchemy"""
    return db.paginate(
        stmt,
        page=page,
        per_page=per_page,
        error_out=False
    )

def safe_int(value, default=0):
    """Convierte a int de forma segura"""
    try:
        return int(value)
    except (ValueError, TypeError):
        return default