import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Alert, AlertDescription } from '../../ui/alert';
import { 
  Plus, 
  Search, 
  Router as RouterIcon, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  Settings,
  Eye,
  Edit,
  Trash2,
  TestTube,
  MoreHorizontal
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import { usePermissions } from '../../../hooks/usePermissions';
import type { Router, RouterFilters } from '../../../types/router';
import axios from 'axios';

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'Error de conexión';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Error desconocido';
};

export const RouterList: React.FC = () => {
  const { canManageRouters, hasPermission } = usePermissions();
  const [routers, setRouters] = useState<Router[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RouterFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRouters = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.branchId) params.append('branch_id', filters.branchId.toString());
      if (filters.isActive !== undefined) params.append('is_active', filters.isActive.toString());
      if (filters.status) params.append('status', filters.status);

      const response = await axios.get(`/api/routers?${params.toString()}`);
      setRouters(response.data);
      setError(null);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRouters();
  }, [fetchRouters]);

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm });
  };

  const handleTestRouter = async (routerId: number) => {
    try {
      await axios.post(`/api/routers/${routerId}/test`);
      fetchRouters(); // Refresh to get updated status
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  const handleDeleteRouter = async (routerId: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este router?')) {
      return;
    }

    try {
      await axios.delete(`/api/routers/${routerId}`);
      fetchRouters();
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <RouterIcon className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status?: string, isActive?: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary">Inactivo</Badge>;
    }
    
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">En línea</Badge>;
      case 'offline':
        return <Badge variant="destructive">Desconectado</Badge>;
      case 'error':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Error</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestión de Routers</h1>
            <p className="text-slate-600">Administra los routers MikroTik de la red</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestión de Routers</h1>
          <p className="text-slate-600">Administra los routers MikroTik de la red</p>
        </div>
        {canManageRouters() && (
          <Button asChild>
            <Link to="/dashboard/routers/create">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Router
            </Link>
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, URI o ubicación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Router Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {routers.map((router) => (
          <Card key={router.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                {getStatusIcon(router.status)}
                <CardTitle className="text-lg">{router.name}</CardTitle>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/dashboard/routers/${router.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver detalles
                    </Link>
                  </DropdownMenuItem>
                  {canManageRouters() && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to={`/dashboard/routers/${router.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      {hasPermission('routers.test') && (
                        <DropdownMenuItem onClick={() => handleTestRouter(router.id)}>
                          <TestTube className="mr-2 h-4 w-4" />
                          Probar conexión
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleDeleteRouter(router.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Estado:</span>
                  {getStatusBadge(router.status, router.isActive)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">URI:</span>
                  <span className="text-sm font-mono text-slate-900">{router.uri}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Usuario:</span>
                  <span className="text-sm text-slate-900">{router.username}</span>
                </div>
                {router.branch && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Sucursal:</span>
                    <span className="text-sm text-slate-900">{router.branch.name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Creado:</span>
                  <span className="text-sm text-slate-900">
                    {new Date(router.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to={`/dashboard/routers/${router.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver
                  </Link>
                </Button>
                {canManageRouters() && (
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to={`/dashboard/routers/${router.id}/edit`}>
                      <Settings className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {routers.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <RouterIcon className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay routers</h3>
            <p className="text-slate-600 mb-4">
              {filters.search 
                ? 'No se encontraron routers que coincidan con tu búsqueda.'
                : 'Comienza agregando tu primer router MikroTik.'
              }
            </p>
            {canManageRouters() && !filters.search && (
              <Button asChild>
                <Link to="/dashboard/routers/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Router
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};