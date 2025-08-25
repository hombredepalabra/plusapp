from __future__ import annotations

import urllib3
from typing import Any, Dict, Tuple, Optional

import requests
from requests.auth import HTTPBasicAuth

from models.router import Router

# The routers usually use self signed certificates.  We disable the
# warnings so the logs stay clean.  In a real project you should install
# proper certificates instead of disabling verification.
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class MikroTikService:
    """Utility methods for talking to the RouterOS REST API."""

    @staticmethod
    def _request(router: Router, endpoint: str) -> Tuple[Optional[Any], Optional[str]]:
        """Perform a GET request against a RouterOS REST endpoint.

        Parameters
        ----------
        router: Router
            Router database model containing connection data.
        endpoint: str
            Endpoint to query, e.g. ``'ppp/secret'``.

        Returns
        -------
        Tuple[Optional[Any], Optional[str]]
            Returns a tuple with the data as the first element and an
            error message as the second element.  Only one of the two will
            be non-``None``.
        """

        url = f"https://{router.uri}/rest/{endpoint.lstrip('/')}"

        try:
            response = requests.get(
                url,
                auth=HTTPBasicAuth(router.username, router.password),
                timeout=10,
                verify=False,
            )
            response.raise_for_status()
            return response.json(), None
        except Exception as exc:  # pragma: no cover - network failures
            return None, str(exc)

    # ------------------------------------------------------------------
    # High level helpers used by the sync service
    # ------------------------------------------------------------------
    @staticmethod
    def test_connection(router: Router) -> Tuple[bool, str]:
        """Validate connectivity with the router.

        A simple request to ``system/resource`` is used as a health check.
        """

        data, error = MikroTikService._request(router, "system/resource")
        return (error is None, "Conexión exitosa" if error is None else error)

    @staticmethod
    def get_pppoe_secrets(router: Router) -> Tuple[Optional[Any], Optional[str]]:
        """Return the configured PPPoE secrets of the router."""

        return MikroTikService._request(router, "ppp/secret")

    @staticmethod
    def get_pppoe_active(router: Router) -> Tuple[Optional[Any], Optional[str]]:
        """Return active PPPoE sessions."""

        return MikroTikService._request(router, "ppp/active")

    @staticmethod
    def get_router_info(router: Router) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """Return general information of the router."""

        return MikroTikService._request(router, "system/resource")

    # ------------------------------------------------------------------
    # CRUD operations for PPPoE secrets
    # ------------------------------------------------------------------
    @staticmethod
    def _request_with_method(router: Router, endpoint: str, method: str = 'GET', data: dict = None) -> Tuple[Optional[Any], Optional[str]]:
        """Perform a request against a RouterOS REST endpoint with specified method.

        Parameters
        ----------
        router: Router
            Router database model containing connection data.
        endpoint: str
            Endpoint to query, e.g. ``'ppp/secret'``.
        method: str
            HTTP method ('GET', 'POST', 'PUT', 'DELETE')
        data: dict
            Data to send in request body

        Returns
        -------
        Tuple[Optional[Any], Optional[str]]
            Returns a tuple with the data as the first element and an
            error message as the second element.  Only one of the two will
            be non-``None``.
        """
    
        url = f"https://{router.uri}/rest/{endpoint.lstrip('/')}"

        try:
            if method == 'GET':
                response = requests.get(
                    url,
                    auth=HTTPBasicAuth(router.username, router.password),
                    timeout=10,
                    verify=False,
                )
            elif method == 'POST':
                response = requests.post(
                    url,
                    json=data,
                    auth=HTTPBasicAuth(router.username, router.password),
                    timeout=10,
                    verify=False,
                )
            elif method == 'PUT':
                response = requests.put(
                    url,
                    json=data,
                    auth=HTTPBasicAuth(router.username, router.password),
                    timeout=10,
                    verify=False,
                )
            elif method == 'DELETE':
                response = requests.delete(
                    url,
                    auth=HTTPBasicAuth(router.username, router.password),
                    timeout=10,
                    verify=False,
                )
            else:
                return None, f"Unsupported HTTP method: {method}"
                
            response.raise_for_status()
            
            # Para DELETE, puede que no haya contenido en la respuesta
            if response.status_code == 204 or not response.content:
                return {"success": True}, None
                
            return response.json(), None
            
        except Exception as exc:  # pragma: no cover - network failures
            return None, str(exc)

    @staticmethod
    def get_pppoe_secret_by_id(router: Router, secret_id: str) -> Tuple[Optional[Any], Optional[str]]:
        """Return a specific PPPoE secret by ID."""
        return MikroTikService._request_with_method(router, f"ppp/secret/{secret_id}", 'GET')

    @staticmethod
    def create_pppoe_secret(router: Router, secret_data: dict) -> Tuple[Optional[Any], Optional[str]]:
        """Create a new PPPoE secret in the router.
        
        Parameters
        ----------
        router: Router
            Router database model containing connection data.
        secret_data: dict
            Dictionary containing secret data with keys:
            - name: str (required)
            - password: str (required) 
            - local-address: str (optional)
            - remote-address: str (optional)
            - profile: str (optional)
            - comment: str (optional)
        """
        return MikroTikService._request_with_method(router, "ppp/secret", 'POST', secret_data)

    @staticmethod
    def update_pppoe_secret(router: Router, secret_id: str, secret_data: dict) -> Tuple[Optional[Any], Optional[str]]:
        """Update an existing PPPoE secret in the router.
        
        Parameters
        ----------
        router: Router
            Router database model containing connection data.
        secret_id: str
            The ID of the secret to update
        secret_data: dict
            Dictionary containing updated secret data
        """
        return MikroTikService._request_with_method(router, f"ppp/secret/{secret_id}", 'PUT', secret_data)

    @staticmethod
    def delete_pppoe_secret(router: Router, secret_id: str) -> Tuple[Optional[Any], Optional[str]]:
        """Delete a PPPoE secret from the router.
        
        Parameters
        ----------
        router: Router
            Router database model containing connection data.
        secret_id: str
            The ID of the secret to delete
        """
        return MikroTikService._request_with_method(router, f"ppp/secret/{secret_id}", 'DELETE')

    # ------------------------------------------------------------------
    # Firewall operations
    # ------------------------------------------------------------------
    @staticmethod
    def get_firewall_rules(router: Router) -> Tuple[Optional[Any], Optional[str]]:
        """Return the configured firewall rules of the router."""
        return MikroTikService._request(router, "ip/firewall/filter")

    @staticmethod
    def add_firewall_rule(router: Router, rule_data: dict) -> Tuple[Optional[Any], Optional[str]]:
        """Create a new firewall rule in the router."""
        return MikroTikService._request_with_method(router, "ip/firewall/filter", 'POST', rule_data)

    @staticmethod
    def update_firewall_rule(router: Router, rule_id: str, rule_data: dict) -> Tuple[Optional[Any], Optional[str]]:
        """Update an existing firewall rule in the router."""
        return MikroTikService._request_with_method(router, f"ip/firewall/filter/{rule_id}", 'PUT', rule_data)

    @staticmethod
    def remove_firewall_rule(router: Router, rule_id: str) -> Tuple[Optional[Any], Optional[str]]:
        """Delete a firewall rule from the router."""
        return MikroTikService._request_with_method(router, f"ip/firewall/filter/{rule_id}", 'DELETE')

