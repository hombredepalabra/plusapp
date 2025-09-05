from flask import request, jsonify
from sqlalchemy import or_
from datetime import datetime
from models import db
from models.router import Router, Secret
from services.mikrotik_service import MikroTikService
from services.encryption_service import EncryptionService
import secrets
import string

class PPPoEController:
    @staticmethod
    def _temp_router(router):
        return type(
            "RouterObj",
            (object,),
            {
                "uri": router.uri,
                "username": router.username,
                "password": EncryptionService.decrypt_password(router.password),
            },
        )
    @staticmethod
    def get_all_clients():
        """GET /api/pppoe/clients - Listar todos los clientes"""
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        force_sync = request.args.get('sync', 'false').lower() == 'true'
        # Filtros opcionales
        search = request.args.get('search', '', type=str)
        router_id = request.args.get('router_id', type=int)
        status = request.args.get('status')
        profile = request.args.get('profile')
        is_active_param = request.args.get('is_active')
        # Si no hay datos en DB o se fuerza sync, intentar sincronizar
        secrets_count = Secret.query.filter_by(is_active=True).count()
        
        if secrets_count == 0 or force_sync:
            # Intentar sincronizar automáticamente
            routers = Router.query.filter_by(is_active=True).all()
            if routers:
                from services.sync_service import SyncService
                if router_id:
                    if any(r.id == router_id for r in routers):
                        SyncService.sync_router(router_id, 'auto')
                else:
                    for r in routers:
                        SyncService.sync_router(r.id, 'auto')
        
        # Construir consulta base
        query = Secret.query

        # Filtrar por estado activo/inactivo
        if is_active_param is not None:
            query = query.filter(Secret.is_active == (is_active_param.lower() == 'true'))
        else:
            query = query.filter(Secret.is_active == True)

        # Filtrar por búsqueda
        if search:
            query = query.filter(
                or_(
                    Secret.name.ilike(f'%{search}%'),
                    Secret.comment.ilike(f'%{search}%'),
                    Secret.ip_address.ilike(f'%{search}%'),
                    Secret.contract.ilike(f'%{search}%')
                )
            )

        # Filtrar por router
        if router_id:
            query = query.filter(Secret.router_id == router_id)

        # Filtrar por perfil
        if profile:
            query = query.filter(Secret.profile == profile)

        # Filtrar por status (mapear a is_active)
        if status:
            if status == 'active':
                query = query.filter(Secret.is_active == True)
            elif status in ['suspended', 'blocked', 'disconnected']:
                query = query.filter(Secret.is_active == False)

        # Consultar datos actualizados
        clients = db.paginate(
            query,
            page=page,
            per_page=per_page,
            error_out=False
        )

        # Mapear IPs activas desde los routers para clientes conectados
        router_ids = {c.router_id for c in clients.items}
        active_ips = {}
        if router_ids:
            routers = Router.query.filter(Router.id.in_(router_ids)).all()
            for router in routers:
                temp_router = PPPoEController._temp_router(router)
                sessions, _ = MikroTikService.get_pppoe_active(temp_router)
                if not sessions:
                    continue
                for s in sessions:
                    name = s.get('name')
                    address = s.get('address') or s.get('remote-address')
                    if name and address:
                        active_ips[name] = address

        return jsonify({
            'clients': [{
                'id': c.id,
                'name': c.name,
                'ip': c.ip_address or active_ips.get(c.name, ''),
                'profile': c.profile,
                'comment': c.comment,
                'contract': c.contract,
                'router_id': c.router_id,
                'is_active': c.is_active,
                'created_at': c.created_at.isoformat() if c.created_at else None
            } for c in clients.items],
            'total': clients.total,
            'pages': clients.pages,
            'current_page': page
        }), 200

    
    @staticmethod
    def create_client():
        """POST /api/pppoe/clients - Crear nuevo cliente"""
        try:
            data = request.get_json()
            
            # Validar datos requeridos
            required_fields = ['router_id', 'name', 'password', 'ip']
            for field in required_fields:
                if field not in data or not data[field]:
                    return jsonify({'error': f'Campo requerido: {field}'}), 400
            
            # Obtener el router
            router = Router.query.get(data['router_id'])
            if not router or not router.is_active:
                return jsonify({'error': 'Router no encontrado o inactivo'}), 404

            # 1. Crear cliente en MikroTik primero
            mikrotik_data = {
                'name': data['name'],
                'password': data['password'],
                'remote-address': data['ip'],
                'profile': data.get('profile', 'default'),
                'comment': data.get('comment', ''),
            }
            
            # Solo agregar local-address si se proporciona
            if data.get('local_address'):
                mikrotik_data['local-address'] = data['local_address']
            
            temp_router = PPPoEController._temp_router(router)
            result, error = MikroTikService.create_pppoe_secret(temp_router, mikrotik_data)
            if error:
                return jsonify({
                    'error': f'Error al crear cliente en MikroTik: {error}'
                }), 500
            
            # 2. Si se creó exitosamente en MikroTik, guardarlo en DB
            client = Secret(
                router_id=data['router_id'],
                ip_address=data['ip'],
                name=data['name'],
                password=data['password'],
                comment=data.get('comment', ''),
                profile=data.get('profile', 'default'),
                contract=data.get('contract', ''),
                is_active=True,
                created_at=datetime.utcnow()
            )
            
            db.session.add(client)
            db.session.commit()
            
            # 3. Enviar datos al frontend
            return jsonify({
                'id': client.id,
                'name': client.name,
                'ip': client.ip_address,
                'profile': client.profile,
                'comment': client.comment,
                'contract': client.contract,
                'router_id': client.router_id,
                'is_active': client.is_active,
                'mikrotik_result': result,
                'message': 'Cliente creado exitosamente en MikroTik y base de datos'
            }), 201
            
        except Exception as e:
            # Si hay error, intentar rollback en caso de que se haya guardado en DB
            db.session.rollback()
            return jsonify({'error': f'Error interno: {str(e)}'}), 500
    
    @staticmethod
    def get_clients_by_router(router_id):
        """GET /api/pppoe/clients/{router_id} - Clientes de un router específico"""
        clients = Secret.query.filter_by(
            router_id=router_id, 
            is_active=True
        ).all()
        
        return jsonify([{
            'id': c.id,
            'name': c.name,
            'ip': c.ip_address,
            'profile': c.profile,
            'comment': c.comment,
            'contract': c.contract,
            'is_active': c.is_active
        } for c in clients]), 200
    
    @staticmethod
    def search_clients():
        """GET /api/pppoe/clients/search - Buscar clientes por nombre"""
        query = request.args.get('q', '')
        if not query:
            return jsonify([]), 200
        
        clients = Secret.query.filter(
            or_(
                Secret.name.ilike(f'%{query}%'),
                Secret.comment.ilike(f'%{query}%'),
                Secret.ip_address.ilike(f'%{query}%'),
                Secret.contract.ilike(f'%{query}%')
            ),
            Secret.is_active == True
        ).limit(20).all()
        
        return jsonify([{
            'id': c.id,
            'name': c.name,
            'ip': c.ip_address,
            'profile': c.profile,
            'comment': c.comment,
            'contract': c.contract
        } for c in clients]), 200
    
    @staticmethod
    def get_client(client_id):
        """GET /api/pppoe/clients/{id} - Obtener cliente específico"""
        try:
            # 1. Primero buscar en la base de datos local
            client = Secret.query.get(client_id)
            
            if client and client.is_active:
                # Cliente encontrado en DB local, devolver datos
                return jsonify({
                    'id': client.id,
                    'name': client.name,
                    'ip': client.ip_address,
                    'profile': client.profile,
                    'comment': client.comment,
                    'contract': client.contract,
                    'router_id': client.router_id,
                    'is_active': client.is_active,
                    'created_at': client.created_at.isoformat() if client.created_at else None,

                    'source': 'database'
                }), 200
            
            # 2. Si no se encuentra en DB, buscar en MikroTik API
            if not client:
                return jsonify({'error': 'Cliente no encontrado'}), 404
                
            # Obtener el router asociado
            router = Router.query.get(client.router_id)
            if not router:
                return jsonify({'error': 'Router no encontrado'}), 404
            
            # Buscar el cliente en MikroTik
            temp_router = PPPoEController._temp_router(router)
            mikrotik_data, error = MikroTikService.get_pppoe_secrets(temp_router)
            if error:
                return jsonify({'error': f'Error al consultar MikroTik: {error}'}), 500
            
            # Buscar el cliente específico en los datos de MikroTik
            mikrotik_client = None
            if mikrotik_data:
                for secret in mikrotik_data:
                    if secret.get('name') == client.name:
                        mikrotik_client = secret
                        break
            
            if mikrotik_client:
                # 3. Actualizar datos en DB con información de MikroTik
                client.ip_address = mikrotik_client.get('remote-address', client.ip_address)
                client.profile = mikrotik_client.get('profile', client.profile)
                client.comment = mikrotik_client.get('comment', client.comment)
                client.created_at = datetime.utcnow()
                
                db.session.commit()
                
                return jsonify({
                    'id': client.id,
                    'name': client.name,
                    'ip': client.ip_address,
                    'profile': client.profile,
                    'comment': client.comment,
                    'contract': client.contract,
                    'router_id': client.router_id,
                    'is_active': client.is_active,
                    'created_at': client.created_at.isoformat() if client.created_at else None,

                    'source': 'mikrotik_synced'
                }), 200
            else:
                # Cliente no encontrado ni en DB ni en MikroTik
                return jsonify({'error': 'Cliente no encontrado en MikroTik'}), 404
                
        except Exception as e:
            return jsonify({'error': f'Error interno: {str(e)}'}), 500
    
    @staticmethod
    def update_client(client_id):
        """PUT /api/pppoe/clients/{id} - Actualizar cliente completo"""
        try:
            data = request.get_json()
            
            # 1. Verificar si existen los datos en la DB
            client = Secret.query.get(client_id)
            if not client:
                return jsonify({'error': 'Cliente no encontrado en base de datos'}), 404
            
            # Obtener el router
            router = Router.query.get(client.router_id)
            if not router or not router.is_active:
                return jsonify({'error': 'Router no encontrado o inactivo'}), 404

            # 2. Buscar el cliente en MikroTik para obtener su ID interno
            temp_router = PPPoEController._temp_router(router)
            mikrotik_secrets, error = MikroTikService.get_pppoe_secrets(temp_router)
            if error:
                return jsonify({
                    'error': f'Error al consultar MikroTik: {error}'
                }), 500
            
            # Encontrar el secret en MikroTik por nombre
            mikrotik_secret_id = None
            if mikrotik_secrets:
                for secret in mikrotik_secrets:
                    if secret.get('name') == client.name:
                        mikrotik_secret_id = secret.get('.id')
                        break
            
            if not mikrotik_secret_id:
                return jsonify({
                    'error': 'Cliente no encontrado en MikroTik'
                }), 404
            
            # 3. Preparar datos para actualizar en MikroTik
            mikrotik_update_data = {}
            
            if 'name' in data:
                mikrotik_update_data['name'] = data['name']
            if 'password' in data:
                mikrotik_update_data['password'] = data['password']
            if 'ip' in data:
                mikrotik_update_data['remote-address'] = data['ip']
            if 'profile' in data:
                mikrotik_update_data['profile'] = data['profile']
            if 'comment' in data:
                mikrotik_update_data['comment'] = data['comment']
            if 'local_address' in data:
                mikrotik_update_data['local-address'] = data['local_address']
            
            # 4. Actualizar en MikroTik primero
            if mikrotik_update_data:
                result, error = MikroTikService.update_pppoe_secret(temp_router, mikrotik_secret_id, mikrotik_update_data)
                if error:
                    return jsonify({
                        'error': f'Error al actualizar cliente en MikroTik: {error}'
                    }), 500
            
            # 5. Si se actualizó exitosamente en MikroTik, actualizar en DB
            if 'name' in data:
                client.name = data['name']
            if 'ip' in data:
                client.ip_address = data['ip']
            if 'password' in data:
                client.password = data['password']
            if 'comment' in data:
                client.comment = data['comment']
            if 'profile' in data:
                client.profile = data['profile']
            if 'contract' in data:
                client.contract = data['contract']
            
            client.created_at = datetime.utcnow()
            db.session.commit()
            
            # 6. Enviar datos actualizados al frontend
            return jsonify({
                'id': client.id,
                'name': client.name,
                'ip': client.ip_address,
                'profile': client.profile,
                'comment': client.comment,
                'contract': client.contract,
                'router_id': client.router_id,
                'is_active': client.is_active,
                'created_at': client.created_at.isoformat() if client.created_at else None,
                'mikrotik_result': result if mikrotik_update_data else None,
                'message': 'Cliente actualizado exitosamente en MikroTik y base de datos'
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Error interno: {str(e)}'}), 500
    
    @staticmethod
    def patch_client(client_id):
        """PATCH /api/pppoe/clients/{id} - Actualización parcial"""
        data = request.get_json()
        client = Secret.query.get_or_404(client_id)
        
        for field in ['name', 'ip_address', 'password', 'comment', 'profile', 'contract']:
            if field in data:
                setattr(client, field, data[field])
        
        db.session.commit()
        
        return jsonify({'message': 'Cliente actualizado exitosamente'}), 200
    
    @staticmethod
    def delete_client(client_id):
        """DELETE /api/pppoe/clients/{id} - Eliminar cliente"""
        try:
            # 1. Buscar cliente en la DB
            client = Secret.query.get(client_id)
            if not client:
                return jsonify({'error': 'Cliente no encontrado en base de datos'}), 404
            
            # Obtener el router
            router = Router.query.get(client.router_id)
            if not router or not router.is_active:
                return jsonify({'error': 'Router no encontrado o inactivo'}), 404

            # 2. Buscar el cliente en MikroTik para obtener su ID interno
            temp_router = PPPoEController._temp_router(router)
            mikrotik_secrets, error = MikroTikService.get_pppoe_secrets(temp_router)
            if error:
                return jsonify({
                    'error': f'Error al consultar MikroTik: {error}',
                    'warning': 'Procediendo con eliminación solo en base de datos'
                }), 500
            
            # Encontrar el secret en MikroTik por nombre
            mikrotik_secret_id = None
            if mikrotik_secrets:
                for secret in mikrotik_secrets:
                    if secret.get('name') == client.name:
                        mikrotik_secret_id = secret.get('.id')
                        break
            
            # 3. Eliminar de MikroTik primero (si existe)
            mikrotik_deleted = False
            if mikrotik_secret_id:
                result, error = MikroTikService.delete_pppoe_secret(temp_router, mikrotik_secret_id)
                if error:
                    return jsonify({
                        'error': f'Error al eliminar cliente de MikroTik: {error}',
                        'warning': 'Cliente existe en MikroTik pero no pudo ser eliminado'
                    }), 500
                mikrotik_deleted = True
            
            # 4. Eliminar de la base de datos
            client_data = {
                'id': client.id,
                'name': client.name,
                'ip': client.ip_address,
                'router_id': client.router_id
            }
            
            db.session.delete(client)
            db.session.commit()
            
            # 5. Enviar mensaje de éxito al frontend
            return jsonify({
                'message': 'Cliente eliminado exitosamente',
                'deleted_client': client_data,
                'mikrotik_deleted': mikrotik_deleted,
                'database_deleted': True,
                'details': {
                    'mikrotik_status': 'eliminado' if mikrotik_deleted else 'no encontrado en MikroTik',
                    'database_status': 'eliminado'
                }
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Error interno: {str(e)}'}), 500
    
    @staticmethod
    def change_client_status(client_id):
        """PUT /api/pppoe/clients/{id}/status - Cambiar estado"""
        data = request.get_json()
        status = data.get('status', 'active')
        
        client = Secret.query.get_or_404(client_id)
        client.is_active = status == 'active'
        db.session.commit()
        
        return jsonify({
            'message': f'Estado del cliente cambiado a {status}'
        }), 200
    
    @staticmethod
    def get_client_sessions(client_id):
        """GET /api/pppoe/clients/{id}/sessions - Sesiones activas"""
        client = Secret.query.get_or_404(client_id)
        
        # Aquí iría la lógica para obtener sesiones activas del MikroTik
        return jsonify({
            'client_id': client_id,
            'sessions': [],
            'message': 'No hay sesiones activas'
        }), 200
    
    @staticmethod
    def disconnect_client_sessions(client_id):
        """DELETE /api/pppoe/clients/{id}/sessions - Desconectar sesiones"""
        client = Secret.query.get_or_404(client_id)
        
        # Aquí iría la lógica para desconectar sesiones en MikroTik
        return jsonify({
            'message': 'Sesiones desconectadas exitosamente'
        }), 200
    
    @staticmethod
    def reset_client_password(client_id):
        """POST /api/pppoe/clients/{id}/reset-password - Resetear contraseña"""
        data = request.get_json() or {}
        client = Secret.query.get_or_404(client_id)
        
        if data.get('auto_generate', False):
            # Generar contraseña aleatoria
            alphabet = string.ascii_letters + string.digits
            new_password = ''.join(secrets.choice(alphabet) for _ in range(8))
        else:
            new_password = data.get('new_password')
            if not new_password:
                return jsonify({'error': 'Nueva contraseña requerida'}), 400
        
        client.password = new_password
        db.session.commit()
        
        return jsonify({
            'message': 'Contraseña reseteada exitosamente',
            'new_password': new_password if data.get('show_password', False) else None
        }), 200
    
    @staticmethod
    def get_client_stats(client_id):
        """GET /api/pppoe/clients/{id}/stats - Estadísticas del cliente"""
        client = Secret.query.get_or_404(client_id)
        
        return jsonify({
            'client_id': client_id,
            'created_at': client.created_at.isoformat() if client.created_at else None,
            'is_active': client.is_active
        }), 200
    
    @staticmethod
    def get_client_logs(client_id):
        """GET /api/pppoe/clients/{id}/logs - Logs de conexión"""
        client = Secret.query.get_or_404(client_id)
        log_type = request.args.get('type', 'all')
        limit = request.args.get('limit', 50, type=int)
        
        # Aquí iría la lógica para obtener logs del cliente
        return jsonify({
            'client_id': client_id,
            'logs': [],
            'message': 'No hay logs disponibles'
        }), 200

    @staticmethod
    def get_active_sessions():
        """GET /api/pppoe/sessions/active - Sesiones PPPoE activas"""
        routers = Router.query.filter_by(is_active=True).all()
        sessions = []
        for router in routers:
            temp_router = PPPoEController._temp_router(router)
            data, error = MikroTikService.get_pppoe_active(temp_router)
            if error or not data:
                continue

            interfaces, _ = MikroTikService.get_interfaces(temp_router)

            for s in data:
                username = s.get('name', '')
                iface = None

                if interfaces:
                    prefix = f"pppoe-{username}"
                    for i in interfaces:
                        name = (i.get('name') or '').strip('<>')
                        if name.startswith(prefix):
                            iface = i
                            break

                if iface:
                    rx_bytes = int(iface.get('rx-byte') or iface.get('rx_bytes') or 0)
                    tx_bytes = int(iface.get('tx-byte') or iface.get('tx_bytes') or 0)
                    rx_packets = int(iface.get('rx-packet') or iface.get('rx_packets') or 0)
                    tx_packets = int(iface.get('tx-packet') or iface.get('tx_packets') or 0)
                    interface_found = True
                else:
                    rx_bytes = tx_bytes = rx_packets = tx_packets = 0
                    interface_found = False

                sessions.append({
                    'id': s.get('.id') or s.get('id'),
                    'clientName': username,
                    'clientId': None,
                    'address': s.get('address', ''),
                    'uptime': s.get('uptime', ''),
                    'rxBytes': rx_bytes,
                    'txBytes': tx_bytes,
                    'rxPackets': rx_packets,
                    'txPackets': tx_packets,
                    'routerId': str(router.id),
                    'routerName': router.name,
                    'callingStationId': s.get('caller-id'),
                    'calledStationId': s.get('called-id'),
                    'interfaceFound': interface_found,
                })
        return jsonify(sessions), 200
