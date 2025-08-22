import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Alert, AlertDescription } from '../../ui/alert';
import { 
  Plus, 
  Search, 
  Wifi, 
  WifiOff, 
  User,
  AlertTriangle,
  Settings,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Ban,
  MoreHorizontal,
  KeyRound,
  Activity
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import { usePermissions } from '../../../hooks/usePermissions';
import { PPPoEClient, PPPoEClientFilters, Router } from '../../../types/router';
import axios from 'axios';

export const ClientList: React.FC = () => {
  const { canManageClients, canControlClients } = usePermissions();
  const [clients, setClients] = useState<PPPoEClient[]>([]);
  const [routers, setRouters] = useState<Router[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PPPoEClientFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
    fetchRouters();
  }, [filters]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.routerId) params.append('router_id', filters.routerId.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.profile) params.append('profile', filters.profile);
      if (filters.isActive !== undefined) params.append('is_active', filters.isActive.toString());

      const response = await axios.get(`/api/pppoe/clients?${params.toString()}`);
      setClients(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const fetchRouters = async () => {
    try {
      const response = await axios.get('/api/routers');
      setRouters(response.data.filter((r: Router) => r.isActive));
    } catch (err: any) {
      console.error('Error loading routers:', err);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm });
  };

  const handleClientAction = async (clientId: string, action: string) => {
    try {
      let endpoint = '';
      let confirmMessage = '';

      switch (action) {
        case 'activate':
          endpoint = `/api/pppoe/clients/${clientId}/activate`;
          confirmMessage = '¿Activar este cliente?';
          break;
        case 'suspend':
          endpoint = `/api/pppoe/clients/${clientId}/suspend`;
          confirmMessage = '¿Suspender este cliente?';
          break;
        case 'block':
          endpoint = `/api/pppoe/clients/${clientId}/block`;
          confirmMessage = '¿Bloquear este cliente?';
          break;
        case 'unblock':
          endpoint = `/api/pppoe/clients/${clientId}/unblock`;
          confirmMessage = '¿Desbloquear este cliente?';
          break;
        case 'reset-password':
          endpoint = `/api/pppoe/clients/${clientId}/reset-password`;
          confirmMessage = '¿Resetear la contraseña de este cliente?';
          break;
        default:
          return;
      }

      if (window.confirm(confirmMessage)) {
        await axios.post(endpoint);
        fetchClients();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Error al ${action} cliente`);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      return;
    }

    try {
      await axios.delete(`/api/pppoe/clients/${clientId}`);
      fetchClients();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar cliente');
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'suspended':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'blocked':
        return <Ban className="h-4 w-4 text-red-500" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-slate-400" />;
      default:
        return <User className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status?: string, isActive?: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary">Inactivo</Badge>;
    }
    
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Suspendido</Badge>;
      case 'blocked':
        return <Badge variant="destructive">Bloqueado</Badge>;
      case 'disconnected':
        return <Badge variant="outline">Desconectado</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Clientes PPPoE</h1>
            <p className="text-slate-600">Gestiona los clientes de conexiones PPPoE</p>
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
          <h1 className="text-3xl font-bold text-slate-900">Clientes PPPoE</h1>
          <p className="text-slate-600">Gestiona los clientes de conexiones PPPoE</p>
        </div>
        {canManageClients() && (
          <Button asChild>
            <Link to="/dashboard/clients/create">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Cliente
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
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, IP o comentario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <select
                value={filters.routerId || ''}
                onChange={(e) => setFilters({ ...filters, routerId: e.target.value ? parseInt(e.target.value) : undefined })}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Todos los routers</option>
                {routers.map(router => (
                  <option key={router.id} value={router.id}>
                    {router.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="suspended">Suspendido</option>
                <option value="blocked">Bloqueado</option>
                <option value="disconnected">Desconectado</option>
              </select>

              <Button onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                {getStatusIcon(client.status)}
                <CardTitle className="text-lg">{client.name}</CardTitle>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/dashboard/clients/${client.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver detalles
                    </Link>
                  </DropdownMenuItem>
                  
                  {canControlClients() && (
                    <>
                      <DropdownMenuSeparator />
                      {client.status !== 'active' && (
                        <DropdownMenuItem onClick={() => handleClientAction(client.id, 'activate')}>
                          <Play className="mr-2 h-4 w-4 text-green-600" />
                          Activar
                        </DropdownMenuItem>
                      )}
                      {client.status === 'active' && (
                        <DropdownMenuItem onClick={() => handleClientAction(client.id, 'suspend')}>
                          <Pause className="mr-2 h-4 w-4 text-yellow-600" />
                          Suspender
                        </DropdownMenuItem>
                      )}
                      {client.status !== 'blocked' && (
                        <DropdownMenuItem onClick={() => handleClientAction(client.id, 'block')}>
                          <Ban className="mr-2 h-4 w-4 text-red-600" />
                          Bloquear
                        </DropdownMenuItem>
                      )}
                      {client.status === 'blocked' && (
                        <DropdownMenuItem onClick={() => handleClientAction(client.id, 'unblock')}>
                          <Play className="mr-2 h-4 w-4 text-green-600" />
                          Desbloquear
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleClientAction(client.id, 'reset-password')}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Resetear contraseña
                      </DropdownMenuItem>
                    </>
                  )}

                  {canManageClients() && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={`/dashboard/clients/${client.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteClient(client.id)}
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
                  {getStatusBadge(client.status, client.isActive)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">IP:</span>
                  <span className="text-sm font-mono text-slate-900">{client.ipAddress}</span>
                </div>
                {client.profile && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Perfil:</span>
                    <Badge variant="outline">{client.profile}</Badge>
                  </div>
                )}
                {client.contract && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Contrato:</span>
                    <span className="text-sm text-slate-900">{client.contract}</span>
                  </div>
                )}
                {client.router && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Router:</span>
                    <span className="text-sm text-slate-900">{client.router.name}</span>
                  </div>
                )}
                {client.comment && (
                  <div className="mt-2">
                    <span className="text-sm text-slate-600">Comentario:</span>
                    <p className="text-sm text-slate-900 mt-1">{client.comment}</p>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to={`/dashboard/clients/${client.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver
                  </Link>
                </Button>
                {canControlClients() && (
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to={`/dashboard/clients/${client.id}`}>
                      <Activity className="mr-2 h-4 w-4" />
                      Sesiones
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {clients.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay clientes</h3>
            <p className="text-slate-600 mb-4">
              {filters.search || filters.routerId || filters.status
                ? 'No se encontraron clientes que coincidan con tu búsqueda.'
                : 'Comienza agregando tu primer cliente PPPoE.'
              }
            </p>
            {canManageClients() && !filters.search && !filters.routerId && !filters.status && (
              <Button asChild>
                <Link to="/dashboard/clients/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Cliente
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};