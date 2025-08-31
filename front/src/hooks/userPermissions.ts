import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export type Permission = 
  | 'users.read' | 'users.create' | 'users.update' | 'users.delete'
  | 'routers.read' | 'routers.create' | 'routers.update' | 'routers.delete' | 'routers.test'
  | 'pppoe.read' | 'pppoe.create' | 'pppoe.update' | 'pppoe.delete' | 'pppoe.control'
  | 'firewall.read' | 'firewall.create' | 'firewall.delete'
  | 'sync.execute' | 'sync.read'
  | 'dashboard.read';

const rolePermissions: Record<string, Permission[]> = {
  admin: [
    'users.read', 'users.create', 'users.update', 'users.delete',
    'routers.read', 'routers.create', 'routers.update', 'routers.delete', 'routers.test',
    'pppoe.read', 'pppoe.create', 'pppoe.update', 'pppoe.delete', 'pppoe.control',
    'firewall.read', 'firewall.create', 'firewall.delete',
    'sync.execute', 'sync.read',
    'dashboard.read'
  ],
  manager: [
    'users.read',
    'routers.read', 'routers.create', 'routers.update', 'routers.delete',
    'pppoe.read', 'pppoe.create', 'pppoe.update', 'pppoe.delete', 'pppoe.control',
    'firewall.read', 'firewall.create', 'firewall.delete',
    'dashboard.read'
  ],
  supervisor: [
    'routers.read',
    'pppoe.read', 'pppoe.update', 'pppoe.control',
    'firewall.read', 'firewall.create', 'firewall.delete',
    'dashboard.read'
  ],
  operator: [
    'routers.read',
    'pppoe.read', 'pppoe.control',
    'firewall.read', 'firewall.create', 'firewall.delete',
    'dashboard.read'
  ],
  user: [
    'routers.read',
    'pppoe.read', 'pppoe.control',
    'firewall.read', 'firewall.create', 'firewall.delete',
    'dashboard.read'
  ],
  guest: [
    'routers.read',
    'pppoe.read',
    'firewall.read',
    'dashboard.read'
  ]
};

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    
    const userRole = user.role || 'guest';
    const permissions = rolePermissions[userRole] || [];
    
    return permissions.includes(permission);
  }, [user]);

  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean =>
      permissions.some(permission => hasPermission(permission)),
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean =>
      permissions.every(permission => hasPermission(permission)),
    [hasPermission]
  );

  const canManageUsers = useCallback(
    (): boolean =>
      hasAnyPermission(['users.create', 'users.update', 'users.delete']),
    [hasAnyPermission]
  );

  const canManageRouters = useCallback(
    (): boolean =>
      hasAnyPermission(['routers.create', 'routers.update', 'routers.delete']),
    [hasAnyPermission]
  );

  const canManageClients = useCallback(
    (): boolean =>
      hasAnyPermission(['pppoe.create', 'pppoe.update', 'pppoe.delete']),
    [hasAnyPermission]
  );

  const canControlClients = useCallback(
    (): boolean => hasPermission('pppoe.control'),
    [hasPermission]
  );

  const canManageFirewall = useCallback(
    (): boolean => hasAnyPermission(['firewall.create', 'firewall.delete']),
    [hasAnyPermission]
  );

  const canSync = useCallback(
    (): boolean => hasPermission('sync.execute'),
    [hasPermission]
  );

  const isAdmin = useCallback((): boolean => user?.role === 'admin', [user]);

  const isManager = useCallback((): boolean => user?.role === 'manager', [user]);

  const getUserRole = useCallback((): string => user?.role || 'guest', [user]);

  const getRoleDisplayName = useCallback((role?: string): string => {
    const roleNames: Record<string, string> = {
      admin: 'Administrador',
      manager: 'Gerente',
      supervisor: 'Supervisor',
      operator: 'Operador', 
      user: 'Usuario',
      guest: 'Invitado'
    };
    
    return roleNames[role || 'guest'] || 'Desconocido';
  }, []);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManageUsers,
    canManageRouters,
    canManageClients,
    canControlClients,
    canManageFirewall,
    canSync,
    isAdmin,
    isManager,
    getUserRole,
    getRoleDisplayName,
    user
  };
};