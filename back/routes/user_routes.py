from flask import Blueprint
from controllers.user_controller import UserController

user_bp = Blueprint('users', __name__)

# Rutas CRUD de usuarios (solo admin)
user_bp.route('/', methods=['GET'], strict_slashes=False)(UserController.get_users)
user_bp.route('/<int:user_id>', methods=['GET'])(UserController.get_user)
user_bp.route('/', methods=['POST'], strict_slashes=False)(UserController.create_user)
user_bp.route('/<int:user_id>', methods=['PUT'])(UserController.update_user)
user_bp.route('/<int:user_id>', methods=['DELETE'])(UserController.delete_user)

# Rutas de perfil (usuario autenticado)
user_bp.route('/profile', methods=['GET'])(UserController.get_profile)
user_bp.route('/profile', methods=['PUT'])(UserController.update_profile)
user_bp.route('/change-password', methods=['PUT'])(UserController.change_password)