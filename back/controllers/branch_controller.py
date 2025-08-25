from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from models.router import Branch
from models import db
from utils.validation import validate_required_fields
from utils.response import success_response, error_response

class BranchController:
    
    @staticmethod
    def get_branches():
        """Get all branches"""
        try:
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 50, type=int)
            
            # Limit per_page to prevent abuse
            per_page = min(per_page, 100)
            
            stmt = db.select(Branch).filter_by(is_active=True)
            branches = db.paginate(
                stmt,
                page=page,
                per_page=per_page,
                error_out=False
            )
            
            result = []
            for branch in branches.items:
                branch_data = {
                    'id': branch.id,
                    'name': branch.name,
                    'location': branch.location,
                    'is_active': branch.is_active,
                    'created_at': branch.created_at.isoformat() if branch.created_at else None,
                    'updated_at': branch.updated_at.isoformat() if branch.updated_at else None,
                    'routers_count': branch.routers.count()
                }
                result.append(branch_data)
            
            return success_response({
                'branches': result,
                'pagination': {
                    'page': branches.page,
                    'per_page': branches.per_page,
                    'total': branches.total,
                    'pages': branches.pages
                }
            })
            
        except Exception as e:
            return error_response(f"Error fetching branches: {str(e)}", 500)
    
    @staticmethod
    def get_branch(branch_id):
        """Get specific branch by ID"""
        try:
            branch = Branch.query.filter_by(id=branch_id, is_active=True).first()
            if not branch:
                return error_response("Branch not found", 404)
            
            routers = []
            for router in branch.routers:
                if router.is_active:
                    routers.append({
                        'id': router.id,
                        'name': router.name,
                        'uri': router.uri,
                        'username': router.username,
                        'is_active': router.is_active
                    })
            
            branch_data = {
                'id': branch.id,
                'name': branch.name,
                'location': branch.location,
                'is_active': branch.is_active,
                'created_at': branch.created_at.isoformat() if branch.created_at else None,
                'updated_at': branch.updated_at.isoformat() if branch.updated_at else None,
                'routers': routers
            }
            
            return success_response(branch_data)
            
        except Exception as e:
            return error_response(f"Error fetching branch: {str(e)}", 500)
    
    @staticmethod
    @jwt_required()
    def create_branch():
        """Create new branch (admin only)"""
        try:
            # Verify admin role (this should be implemented in middleware)
            current_user_id = get_jwt_identity()
            
            data = request.get_json()
            if not data:
                return error_response("No data provided", 400)
            
            # Validate required fields
            required_fields = ['name']
            validation_error = validate_required_fields(data, required_fields)
            if validation_error:
                return validation_error
            
            # Check if branch name already exists
            existing_branch = Branch.query.filter_by(name=data['name'], is_active=True).first()
            if existing_branch:
                return error_response("Branch with this name already exists", 400)
            
            # Create new branch
            branch = Branch(
                name=data['name'].strip(),
                location=data.get('location', '').strip() if data.get('location') else None,
                is_active=True
            )
            
            db.session.add(branch)
            db.session.commit()
            
            branch_data = {
                'id': branch.id,
                'name': branch.name,
                'location': branch.location,
                'is_active': branch.is_active,
                'created_at': branch.created_at.isoformat(),
                'updated_at': branch.updated_at.isoformat()
            }
            
            return success_response(branch_data, 201)
            
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error creating branch: {str(e)}", 500)
    
    @staticmethod
    @jwt_required()
    def update_branch(branch_id):
        """Update existing branch (admin only)"""
        try:
            branch = Branch.query.filter_by(id=branch_id, is_active=True).first()
            if not branch:
                return error_response("Branch not found", 404)
            
            data = request.get_json()
            if not data:
                return error_response("No data provided", 400)
            
            # Update fields if provided
            if 'name' in data:
                name = data['name'].strip()
                if not name:
                    return error_response("Name cannot be empty", 400)
                
                # Check if name already exists for another branch
                existing_branch = Branch.query.filter_by(name=name, is_active=True).filter(Branch.id != branch_id).first()
                if existing_branch:
                    return error_response("Branch with this name already exists", 400)
                
                branch.name = name
            
            if 'location' in data:
                branch.location = data['location'].strip() if data['location'] else None
            
            if 'is_active' in data:
                branch.is_active = bool(data['is_active'])
            
            db.session.commit()
            
            branch_data = {
                'id': branch.id,
                'name': branch.name,
                'location': branch.location,
                'is_active': branch.is_active,
                'created_at': branch.created_at.isoformat(),
                'updated_at': branch.updated_at.isoformat()
            }
            
            return success_response(branch_data)
            
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error updating branch: {str(e)}", 500)
    
    @staticmethod
    @jwt_required()
    def delete_branch(branch_id):
        """Delete branch (admin only) - soft delete"""
        try:
            branch = Branch.query.filter_by(id=branch_id, is_active=True).first()
            if not branch:
                return error_response("Branch not found", 404)
            
            # Check if branch has active routers
            active_routers_count = branch.routers.filter_by(is_active=True).count()
            if active_routers_count > 0:
                return error_response(f"Cannot delete branch with {active_routers_count} active routers", 400)
            
            # Soft delete
            branch.is_active = False
            db.session.commit()
            
            return success_response({"message": "Branch deleted successfully"})
            
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error deleting branch: {str(e)}", 500)