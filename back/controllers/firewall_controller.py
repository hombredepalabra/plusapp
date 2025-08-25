from flask import request, jsonify
from datetime import datetime
from models import db, Router, RouterFirewall
from services.mikrotik_service import MikroTikService
import secrets


class FirewallController:
    """Controlador para gestión de reglas de firewall"""

    @staticmethod
    def get_rules():
        """GET /api/firewall/rules - Listar reglas de firewall activas"""
        try:
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 50, type=int)
            force_sync = request.args.get('sync', 'false').lower() == 'true'
            router_id = request.args.get('router_id', type=int)
            
            # Si no hay datos en DB o se fuerza sync, intentar sincronizar
            rules_count = RouterFirewall.query.filter_by(is_active=True).count()
            
            if rules_count == 0 or force_sync:
                # Intentar sincronizar automáticamente
                if router_id:
                    routers = [Router.query.get(router_id)] if Router.query.get(router_id) else []
                else:
                    routers = Router.query.filter_by(is_active=True).all()
                
                if routers:
                    from services.sync_service import SyncService
                    for router in routers[:3]:  # Limitar a 3 routers para evitar timeouts
                        if router:
                            SyncService.sync_firewall_rules(router.id)
            
            # Construir query base
            query = RouterFirewall.query.filter_by(is_active=True)
            
            # Filtrar por router si se especifica
            if router_id:
                query = query.filter_by(router_id=router_id)
            
            # Paginar resultados
            rules = query.paginate(page=page, per_page=per_page, error_out=False)
            
            return jsonify({
                'rules': [
                    {
                        'id': r.firewall_id,
                        'routerId': str(r.router_id),
                        'routerName': r.router.name if r.router else '',
                        'ipAddress': r.ip_address,
                        'comment': r.comment,
                        'creationDate': r.creation_date,
                        'isActive': r.is_active,
                        'protocol': getattr(r, 'protocol', 'ip'),
                        'port': getattr(r, 'port', None),
                        'action': getattr(r, 'action', 'drop'),
                        'chain': getattr(r, 'chain', 'input'),
                        'created_at': r.created_at.isoformat() if hasattr(r, 'created_at') and r.created_at else None
                    }
                    for r in rules.items
                ],
                'total': rules.total,
                'pages': rules.pages,
                'current_page': page
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Error interno: {str(e)}'}), 500

    @staticmethod
    def block_ip():
        """POST /api/firewall/block-ip - Bloquear una dirección IP"""
        try:
            data = request.get_json() or {}
            ip_address = data.get('ipAddress')
            router_id = data.get('routerId')
            comment = data.get('comment', '')
            protocol = data.get('protocol', 'ip')
            port = data.get('port')
            chain = data.get('chain', 'input')
            action = data.get('action', 'drop')

            # Validaciones
            if not ip_address or not router_id:
                return jsonify({'message': 'ipAddress y routerId son requeridos'}), 400

            router = Router.query.get(int(router_id))
            if not router or not router.is_active:
                return jsonify({'message': 'Router no encontrado o inactivo'}), 404

            # 1. Crear regla en MikroTik primero
            mikrotik_data = {
                'chain': chain,
                'action': action,
                'src-address': ip_address,
                'comment': comment or f'Bloqueado por API - {datetime.utcnow().strftime("%Y-%m-%d %H:%M")}'
            }
            
            # Agregar protocolo y puerto si se especifica
            if protocol and protocol != 'ip':
                mikrotik_data['protocol'] = protocol
            if port:
                mikrotik_data['dst-port'] = str(port)

            result, error = MikroTikService.add_firewall_rule(router, mikrotik_data)
            if error:
                return jsonify({
                    'error': f'Error al crear regla en MikroTik: {error}'
                }), 500

            # 2. Si se creó exitosamente en MikroTik, guardarlo en DB
            rule = RouterFirewall(
                router_id=router.id,
                firewall_id=secrets.token_hex(8),
                ip_address=ip_address,
                comment=mikrotik_data['comment'],
                creation_date=datetime.utcnow().isoformat(),
                is_active=True,
                created_at=datetime.utcnow()
            )
            
            # Agregar campos adicionales si el modelo los soporta
            if hasattr(rule, 'protocol'):
                rule.protocol = protocol
            if hasattr(rule, 'port'):
                rule.port = port
            if hasattr(rule, 'action'):
                rule.action = action
            if hasattr(rule, 'chain'):
                rule.chain = chain
            
            db.session.add(rule)
            db.session.commit()

            return jsonify({
                'message': 'IP bloqueada exitosamente',
                'id': rule.firewall_id,
                'rule': {
                    'id': rule.firewall_id,
                    'routerId': str(rule.router_id),
                    'routerName': router.name,
                    'ipAddress': rule.ip_address,
                    'comment': rule.comment,
                    'creationDate': rule.creation_date,
                    'isActive': rule.is_active,
                    'protocol': protocol,
                    'port': port,
                    'action': action,
                    'chain': chain
                },
                'mikrotik_result': result
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Error interno: {str(e)}'}), 500

    @staticmethod
    def unblock_ip():
        """DELETE /api/firewall/unblock-ip - Desbloquear una dirección IP"""
        try:
            data = request.get_json() or {}
            ip_address = data.get('ipAddress')
            router_id = data.get('routerId')
            
            if not ip_address:
                return jsonify({'message': 'ipAddress es requerido'}), 400

            # Buscar regla en la base de datos
            query = RouterFirewall.query.filter_by(ip_address=ip_address, is_active=True)
            if router_id:
                query = query.filter_by(router_id=int(router_id))
            
            rule = query.first()
            if not rule:
                return jsonify({'message': 'Regla no encontrada en base de datos'}), 404

            # Obtener el router
            router = Router.query.get(rule.router_id)
            if not router or not router.is_active:
                return jsonify({'error': 'Router no encontrado o inactivo'}), 404

            # 1. Buscar la regla en MikroTik para obtener su ID interno
            mikrotik_rules, error = MikroTikService.get_firewall_rules(router)
            if error:
                return jsonify({
                    'error': f'Error al consultar MikroTik: {error}',
                    'warning': 'Procediendo con eliminación solo en base de datos'
                }), 500

            # Encontrar la regla en MikroTik
            mikrotik_rule_id = None
            if mikrotik_rules:
                for fw_rule in mikrotik_rules:
                    if fw_rule.get('src-address') == ip_address:
                        mikrotik_rule_id = fw_rule.get('.id')
                        break

            # 2. Eliminar de MikroTik primero (si existe)
            mikrotik_deleted = False
            if mikrotik_rule_id:
                result, error = MikroTikService.remove_firewall_rule(router, mikrotik_rule_id)
                if error:
                    return jsonify({
                        'error': f'Error al eliminar regla de MikroTik: {error}',
                        'warning': 'Regla existe en MikroTik pero no pudo ser eliminada'
                    }), 500
                mikrotik_deleted = True

            # 3. Desactivar en la base de datos
            rule_data = {
                'id': rule.firewall_id,
                'ip_address': rule.ip_address,
                'router_id': rule.router_id,
                'comment': rule.comment
            }
            
            rule.is_active = False
            db.session.commit()
            
            return jsonify({
                'message': 'IP desbloqueada exitosamente',
                'deleted_rule': rule_data,
                'mikrotik_deleted': mikrotik_deleted,
                'database_updated': True,
                'details': {
                    'mikrotik_status': 'eliminado' if mikrotik_deleted else 'no encontrado en MikroTik',
                    'database_status': 'desactivado'
                }
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Error interno: {str(e)}'}), 500

    @staticmethod
    def get_rule(rule_id):
        """GET /api/firewall/rules/{id} - Obtener regla específica"""
        try:
            # Buscar en la base de datos local
            rule = RouterFirewall.query.filter_by(firewall_id=rule_id, is_active=True).first()
            
            if not rule:
                return jsonify({'error': 'Regla no encontrada'}), 404

            # Obtener el router asociado
            router = Router.query.get(rule.router_id)
            if not router:
                return jsonify({'error': 'Router no encontrado'}), 404

            # Buscar la regla en MikroTik para datos actualizados
            mikrotik_rules, error = MikroTikService.get_firewall_rules(router)
            mikrotik_rule = None
            
            if not error and mikrotik_rules:
                for fw_rule in mikrotik_rules:
                    if fw_rule.get('src-address') == rule.ip_address:
                        mikrotik_rule = fw_rule
                        break

            return jsonify({
                'id': rule.firewall_id,
                'routerId': str(rule.router_id),
                'routerName': router.name,
                'ipAddress': rule.ip_address,
                'comment': rule.comment,
                'creationDate': rule.creation_date,
                'isActive': rule.is_active,
                'protocol': getattr(rule, 'protocol', 'ip'),
                'port': getattr(rule, 'port', None),
                'action': getattr(rule, 'action', 'drop'),
                'chain': getattr(rule, 'chain', 'input'),
                'created_at': rule.created_at.isoformat() if hasattr(rule, 'created_at') and rule.created_at else None,
                'mikrotik_status': 'found' if mikrotik_rule else 'not_found',
                'source': 'database'
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Error interno: {str(e)}'}), 500

    @staticmethod
    def get_rules_by_router(router_id):
        """GET /api/firewall/rules/router/{router_id} - Reglas de un router específico"""
        try:
            router = Router.query.get(router_id)
            if not router or not router.is_active:
                return jsonify({'error': 'Router no encontrado o inactivo'}), 404
            
            rules = RouterFirewall.query.filter_by(
                router_id=router_id, 
                is_active=True
            ).all()

            return jsonify([{
                'id': r.firewall_id,
                'routerId': str(r.router_id),
                'routerName': router.name,
                'ipAddress': r.ip_address,
                'comment': r.comment,
                'creationDate': r.creation_date,
                'isActive': r.is_active,
                'protocol': getattr(r, 'protocol', 'ip'),
                'port': getattr(r, 'port', None),
                'action': getattr(r, 'action', 'drop'),
                'chain': getattr(r, 'chain', 'input')
            } for r in rules]), 200
            
        except Exception as e:
            return jsonify({'error': f'Error interno: {str(e)}'}), 500

    @staticmethod
    def search_rules():
        """GET /api/firewall/rules/search - Buscar reglas"""
        try:
            query = request.args.get('q', '')
            if not query:
                return jsonify([]), 200

            from sqlalchemy import or_
            rules = RouterFirewall.query.filter(
                or_(
                    RouterFirewall.ip_address.ilike(f'%{query}%'),
                    RouterFirewall.comment.ilike(f'%{query}%')
                ),
                RouterFirewall.is_active == True
            ).limit(20).all()

            return jsonify([{
                'id': r.firewall_id,
                'routerId': str(r.router_id),
                'routerName': r.router.name if r.router else '',
                'ipAddress': r.ip_address,
                'comment': r.comment,
                'creationDate': r.creation_date,
                'isActive': r.is_active
            } for r in rules]), 200
            
        except Exception as e:
            return jsonify({'error': f'Error interno: {str(e)}'}), 500

    @staticmethod
    def update_rule(rule_id):
        """PUT /api/firewall/rules/{id} - Actualizar regla"""
        try:
            data = request.get_json()
            
            # Buscar regla en la DB
            rule = RouterFirewall.query.filter_by(firewall_id=rule_id, is_active=True).first()
            if not rule:
                return jsonify({'error': 'Regla no encontrada en base de datos'}), 404

            # Obtener el router
            router = Router.query.get(rule.router_id)
            if not router or not router.is_active:
                return jsonify({'error': 'Router no encontrado o inactivo'}), 404

            # Buscar la regla en MikroTik
            mikrotik_rules, error = MikroTikService.get_firewall_rules(router)
            if error:
                return jsonify({
                    'error': f'Error al consultar MikroTik: {error}'
                }), 500

            # Encontrar la regla en MikroTik
            mikrotik_rule_id = None
            if mikrotik_rules:
                for fw_rule in mikrotik_rules:
                    if fw_rule.get('src-address') == rule.ip_address:
                        mikrotik_rule_id = fw_rule.get('.id')
                        break

            if not mikrotik_rule_id:
                return jsonify({
                    'error': 'Regla no encontrada en MikroTik'
                }), 404

            # Preparar datos para actualizar en MikroTik
            mikrotik_update_data = {}
            
            if 'comment' in data:
                mikrotik_update_data['comment'] = data['comment']
            if 'action' in data:
                mikrotik_update_data['action'] = data['action']
            if 'protocol' in data and data['protocol'] != 'ip':
                mikrotik_update_data['protocol'] = data['protocol']
            if 'port' in data:
                mikrotik_update_data['dst-port'] = str(data['port'])

            # Actualizar en MikroTik primero
            if mikrotik_update_data:
                result, error = MikroTikService.update_firewall_rule(router, mikrotik_rule_id, mikrotik_update_data)
                if error:
                    return jsonify({
                        'error': f'Error al actualizar regla en MikroTik: {error}'
                    }), 500

            # Actualizar en DB
            if 'comment' in data:
                rule.comment = data['comment']
            if 'action' in data and hasattr(rule, 'action'):
                rule.action = data['action']
            if 'protocol' in data and hasattr(rule, 'protocol'):
                rule.protocol = data['protocol']
            if 'port' in data and hasattr(rule, 'port'):
                rule.port = data['port']

            if hasattr(rule, 'updated_at'):
                rule.updated_at = datetime.utcnow()
            
            db.session.commit()

            return jsonify({
                'id': rule.firewall_id,
                'routerId': str(rule.router_id),
                'routerName': router.name,
                'ipAddress': rule.ip_address,
                'comment': rule.comment,
                'creationDate': rule.creation_date,
                'isActive': rule.is_active,
                'message': 'Regla actualizada exitosamente en MikroTik y base de datos',
                'mikrotik_result': result if mikrotik_update_data else None
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Error interno: {str(e)}'}), 500

    @staticmethod
    def delete_rule(rule_id):
        """DELETE /api/firewall/rules/{id} - Eliminar regla"""
        try:
            # Buscar regla en la DB
            rule = RouterFirewall.query.filter_by(firewall_id=rule_id, is_active=True).first()
            if not rule:
                return jsonify({'error': 'Regla no encontrada en base de datos'}), 404

            # Obtener el router
            router = Router.query.get(rule.router_id)
            if not router or not router.is_active:
                return jsonify({'error': 'Router no encontrado o inactivo'}), 404

            # Buscar la regla en MikroTik
            mikrotik_rules, error = MikroTikService.get_firewall_rules(router)
            if error:
                return jsonify({
                    'error': f'Error al consultar MikroTik: {error}',
                    'warning': 'Procediendo con eliminación solo en base de datos'
                }), 500

            # Encontrar la regla en MikroTik
            mikrotik_rule_id = None
            if mikrotik_rules:
                for fw_rule in mikrotik_rules:
                    if fw_rule.get('src-address') == rule.ip_address:
                        mikrotik_rule_id = fw_rule.get('.id')
                        break

            # Eliminar de MikroTik primero (si existe)
            mikrotik_deleted = False
            if mikrotik_rule_id:
                result, error = MikroTikService.remove_firewall_rule(router, mikrotik_rule_id)
                if error:
                    return jsonify({
                        'error': f'Error al eliminar regla de MikroTik: {error}',
                        'warning': 'Regla existe en MikroTik pero no pudo ser eliminada'
                    }), 500
                mikrotik_deleted = True

            # Eliminar de la base de datos
            rule_data = {
                'id': rule.firewall_id,
                'ip_address': rule.ip_address,
                'router_id': rule.router_id,
                'comment': rule.comment
            }

            db.session.delete(rule)
            db.session.commit()

            return jsonify({
                'message': 'Regla eliminada exitosamente',
                'deleted_rule': rule_data,
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
    def sync_rules():
        """POST /api/firewall/rules/sync - Sincronizar reglas con MikroTik"""
        try:
            data = request.get_json() or {}
            router_id = data.get('router_id')
            
            if router_id:
                routers = [Router.query.get(router_id)] if Router.query.get(router_id) else []
            else:
                routers = Router.query.filter_by(is_active=True).all()

            if not routers:
                return jsonify({'error': 'No hay routers disponibles'}), 404

            from services.sync_service import SyncService
            sync_results = []
            
            for router in routers:
                if router:
                    try:
                        result = SyncService.sync_firewall_rules(router.id)
                        sync_results.append({
                            'router_id': router.id,
                            'router_name': router.name,
                            'status': 'success',
                            'result': result
                        })
                    except Exception as e:
                        sync_results.append({
                            'router_id': router.id,
                            'router_name': router.name,
                            'status': 'error',
                            'error': str(e)
                        })

            return jsonify({
                'message': 'Sincronización completada',
                'results': sync_results
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Error interno: {str(e)}'}), 500

    @staticmethod
    def get_firewall_stats():
        """GET /api/firewall/stats - Estadísticas del firewall"""
        try:
            stats = {
                'total_rules': RouterFirewall.query.filter_by(is_active=True).count(),
                'rules_by_router': {},
                'recent_blocks': RouterFirewall.query.filter_by(is_active=True).order_by(
                    RouterFirewall.created_at.desc() if hasattr(RouterFirewall, 'created_at') else RouterFirewall.creation_date.desc()
                ).limit(10).all()
            }
            
            # Estadísticas por router
            routers = Router.query.filter_by(is_active=True).all()
            for router in routers:
                rules_count = RouterFirewall.query.filter_by(
                    router_id=router.id, 
                    is_active=True
                ).count()
                stats['rules_by_router'][router.name] = rules_count
            
            # Formatear bloques recientes
            stats['recent_blocks'] = [{
                'id': r.firewall_id,
                'ip_address': r.ip_address,
                'comment': r.comment,
                'router_name': r.router.name if r.router else '',
                'creation_date': r.creation_date
            } for r in stats['recent_blocks']]
            
            return jsonify(stats), 200
            
        except Exception as e:
            return jsonify({'error': f'Error interno: {str(e)}'}), 500