import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { usePermissions, type Permission } from '../../hooks/usePermissions';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  Home, 
  User, 
  Shield, 
  Router, 
  Users, 
  Wifi, 
  Activity, 
  ShieldCheck,
  RefreshCw,
  Building
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
  badge?: string;
}

const navigation: NavigationItem[] = [
  {
    name: 'Panel Principal',
    href: '/dashboard',
    icon: Home,
    permission: 'dashboard.read'
  },
  {
    name: 'Routers',
    href: '/dashboard/routers',
    icon: Router,
    permission: 'routers.read'
  },
  {
    name: 'Clientes PPPoE',
    href: '/dashboard/clients',
    icon: Wifi,
    permission: 'pppoe.read'
  },
  {
    name: 'Sesiones Activas',
    href: '/dashboard/sessions',
    icon: Activity,
    permission: 'pppoe.read'
  },
  {
    name: 'Firewall',
    href: '/dashboard/firewall',
    icon: ShieldCheck,
    permission: 'firewall.read'
  },
];

const adminNavigation: NavigationItem[] = [
  {
    name: 'Usuarios',
    href: '/dashboard/users',
    icon: Users,
    permission: 'users.read'
  },
  {
    name: 'Sucursales',
    href: '/dashboard/branches',
    icon: Building,
    permission: 'routers.read'
  },
  {
    name: 'Sincronización',
    href: '/dashboard/sync',
    icon: RefreshCw,
    permission: 'sync.read'
  },
];

const profileNavigation: NavigationItem[] = [
  {
    name: 'Perfil',
    href: '/dashboard/profile',
    icon: User,
  },
  {
    name: 'Seguridad',
    href: '/dashboard/security',
    icon: Shield,
  },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { hasPermission, canManageUsers, getRoleDisplayName, user } = usePermissions();

  const renderNavigationItem = (item: NavigationItem) => {
    if (item.permission && !hasPermission(item.permission)) {
      return null;
    }

    const isActive = location.pathname === item.href || 
                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
    
    return (
      <Button
        key={item.name}
        asChild
        variant={isActive ? 'secondary' : 'ghost'}
        className={cn(
          'w-full justify-start',
          isActive 
            ? 'bg-blue-50 text-blue-900 font-medium border border-blue-200' 
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        )}
      >
        <Link to={item.href}>
          <item.icon className="mr-3 h-5 w-5" />
          <span className="flex-1 text-left">{item.name}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto">
              {item.badge}
            </Badge>
          )}
        </Link>
      </Button>
    );
  };

  return (
    <div className="flex w-64 flex-col bg-white border-r border-slate-200 shadow-sm">
      <div className="flex h-16 items-center justify-center border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
            <Router className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">MikroTik Manager</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {/* Sección Principal */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
            Principal
          </p>
          {navigation.map(renderNavigationItem)}
        </div>

        {/* Sección Administración */}
        {canManageUsers() && (
          <>
            <Separator className="my-3" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                Administración
              </p>
              {adminNavigation.map(renderNavigationItem)}
            </div>
          </>
        )}

        {/* Sección Perfil */}
        <Separator className="my-3" />
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
            Cuenta
          </p>
          {profileNavigation.map(renderNavigationItem)}
        </div>
      </nav>
      
      <div className="p-4 border-t border-slate-200">
        <div className="text-xs text-slate-500 text-center space-y-1">
          {user && (
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {getRoleDisplayName(user.role)}
              </Badge>
            </div>
          )}
          <p>Versión 1.0.0</p>
          <p>© 2025 Ariels875</p>
        </div>
      </div>
    </div>
  );
};