import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import type { UserData } from '../../types/user';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { RefreshCw, User, Shield, Mail, Calendar } from 'lucide-react';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadUsers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await userService.getUsers(page, 20);
      setUsers(response.users);
      setCurrentPage(response.current_page);
      setTotalPages(response.pages);
      setTotal(response.total);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'supervisor':
        return 'default';
      case 'operator':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Usuarios del Sistema</h1>
          <p className="text-slate-600">Gestión de usuarios y permisos</p>
        </div>
        <Button 
          onClick={() => loadUsers(currentPage)}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <Card className="p-6">
        <div className="mb-4 text-sm text-slate-600">
          Total: {total} usuarios
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Usuario</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Rol</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">2FA</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Último Login</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Creado</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <div>
                          <div className="font-medium text-slate-900">{user.username}</div>
                          <div className="text-sm text-slate-500">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={user.two_factor_enabled ? "default" : "outline"}>
                        {user.two_factor_enabled ? 'Habilitado' : 'Deshabilitado'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={user.is_active ? "default" : "destructive"}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-500">
                          {user.last_login 
                            ? new Date(user.last_login).toLocaleDateString() 
                            : 'Nunca'
                          }
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadUsers(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
            >
              Anterior
            </Button>
            <span className="flex items-center px-3 text-sm text-slate-600">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadUsers(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
            >
              Siguiente
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};