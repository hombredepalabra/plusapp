import os
import sys
from unittest.mock import patch

from cryptography.fernet import Fernet
from flask_jwt_extended import create_access_token

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# Configurar variables de entorno antes de crear la app
os.environ['SECRET_KEY'] = 'testing'
os.environ['JWT_SECRET_KEY'] = 'jwt-secret'
os.environ['DATABASE_URL'] = 'sqlite:///test.db'
os.environ['ENCRYPTION_KEY'] = Fernet.generate_key().decode()

from app import create_app
from models import db
from models.router import Router, Branch
from models.user import User
from services.encryption_service import EncryptionService


def get_client():
    app = create_app()
    app.config['TESTING'] = True

    with app.app_context():
        db.drop_all()
        db.create_all()
        branch = Branch(name='b1')
        db.session.add(branch)
        db.session.commit()
        router = Router(
            name='r1',
            uri='example.com',
            username='admin',
            password=EncryptionService.encrypt_password('secret'),
            branch_id=branch.id,
        )
        user = User(username='u1', email='u1@example.com', password_hash='x')
        db.session.add_all([router, user])
        db.session.commit()
        token = create_access_token(identity=user.id)
        router_id = router.id

    client = app.test_client()
    return app, client, router_id, token


def test_test_connection_returns_401_on_failure():
    app, client, router_id, token = get_client()
    headers = {'Authorization': f'Bearer {token}'}
    with patch('services.mikrotik_service.MikroTikService.test_connection', return_value=(False, 'Unauthorized')):
        response = client.post(
            f'/api/routers/{router_id}/test',
            headers=headers,
            base_url='https://localhost',
        )
    assert response.status_code == 401
    data = response.get_json()
    assert data['success'] is False

    # Cleanup
    with app.app_context():
        db.drop_all()
    if os.path.exists('test.db'):
        os.remove('test.db')
