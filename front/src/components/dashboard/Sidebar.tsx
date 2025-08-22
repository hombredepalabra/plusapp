import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Home, User, Shield, Settings, Wifi, Users } from 'lucide-react';

const navigation = [
  {
    name: 'Inicio',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Clientes PPPoE',
    href: '/dashboard/pppoe-clients',
    icon: Wifi,
  },
  {
    name: 'Usuarios',
    href: '/dashboard/users',
    icon: Users,
  },
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

  return (
    <div className="flex w-64 flex-col bg-white border-r border-slate-200 shadow-sm">
      <div className="flex h-16 items-center justify-center border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">SecureApp</span>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Button
              key={item.name}
              asChild
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start',
                isActive 
                  ? 'bg-slate-100 text-slate-900 font-medium' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <Link to={item.href}>
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            </Button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-200">
        <div className="text-xs text-slate-500 text-center">
          <p>Versión 1.0.0</p>
          <p className="mt-1">© 2025 SecureApp</p>
        </div>
      </div>
    </div>
  );
};