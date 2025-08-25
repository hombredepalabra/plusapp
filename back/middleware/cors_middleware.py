from flask_cors import CORS

def init_cors(app):
    """Inicializa CORS con configuración segura"""
    CORS(app, 
         origins=['http://localhost:5000', 'http://127.0.0.1:5000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', "PATCH"],
         allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', "Accept", "Origin"],
         supports_credentials=True,
         expose_headers=['Content-Type', 'Authorization'])