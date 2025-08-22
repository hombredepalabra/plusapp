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

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    
    const userRole = user.role || 'guest';
    const permissions = rolePermissions[userRole] || [];
    
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const canManageUsers = (): boolean => {
    return hasAnyPermission(['users.create', 'users.update', 'users.delete']);
  };

  const canManageRouters = (): boolean => {
    return hasAnyPermission(['routers.create', 'routers.update', 'routers.delete']);
  };

  const canManageClients = (): boolean => {
    return hasAnyPermission(['pppoe.create', 'pppoe.update', 'pppoe.delete']);
  };

  const canControlClients = (): boolean => {
    return hasPermission('pppoe.control');
  };

  const canManageFirewall = (): boolean => {
    return hasAnyPermission(['firewall.create', 'firewall.delete']);
  };

  const canSync = (): boolean => {
    return hasPermission('sync.execute');
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  const isManager = (): boolean => {
    return user?.role === 'manager';
  };

  const getUserRole = (): string => {
    return user?.role || 'guest';
  };

  const getRoleDisplayName = (role?: string): string => {
    const roleNames: Record<string, string> = {
      admin: 'Administrador',
      manager: 'Gerente',
      supervisor: 'Supervisor',
      operator: 'Operador', 
      user: 'Usuario',
      guest: 'Invitado'
    };
    
    return roleNames[role || 'guest'] || 'Desconocido';
  };

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