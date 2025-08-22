from flask import request, jsonify
from datetime import datetime
from models import db, Router, RouterFirewall
import secrets


class FirewallController:
    """Controlador para gestión de reglas de firewall"""

    @staticmethod
    def get_rules():
        """GET /api/firewall/rules - Listar reglas de firewall activas"""
        rules = RouterFirewall.query.filter_by(is_active=True).all()
        return jsonify([
            {
                'id': r.firewall_id,
                'routerId': str(r.router_id),
                'routerName': r.router.name if r.router else '',
                'ipAddress': r.ip_address,
                'comment': r.comment,
                'creationDate': r.creation_date,
                'isActive': r.is_active,
            }
            for r in rules
        ]), 200

    @staticmethod
    def block_ip():
        """POST /api/firewall/block-ip - Bloquear una dirección IP"""
        data = request.get_json() or {}
        ip_address = data.get('ipAddress')
        router_id = data.get('routerId')
        comment = data.get('comment')

        if not ip_address or not router_id:
            return jsonify({'message': 'ipAddress y routerId son requeridos'}), 400

        router = Router.query.get(int(router_id))
        if not router:
            return jsonify({'message': 'Router no encontrado'}), 404

        rule = RouterFirewall(
            router_id=router.id,
            firewall_id=secrets.token_hex(8),
            ip_address=ip_address,
            comment=comment,
            creation_date=datetime.utcnow().isoformat(),
            is_active=True,
        )
        db.session.add(rule)
        db.session.commit()

        return jsonify({'message': 'IP bloqueada', 'id': rule.firewall_id}), 201

    @staticmethod
    def unblock_ip():
        """DELETE /api/firewall/unblock-ip - Desbloquear una dirección IP"""
        data = request.get_json() or {}
        ip_address = data.get('ipAddress')
        if not ip_address:
            return jsonify({'message': 'ipAddress es requerido'}), 400

        rule = RouterFirewall.query.filter_by(ip_address=ip_address, is_active=True).first()
        if not rule:
            return jsonify({'message': 'Regla no encontrada'}), 404

        rule.is_active = False
        db.session.commit()
        return jsonify({'message': 'IP desbloqueada'}), 200
