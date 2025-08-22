import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  User, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  Activity,
  Settings,
  Play,
  Pause,
  KeyRound,
  BarChart3
} from 'lucide-react';
import { usePermissions } from '../../../hooks/usePermissions';
import axios from 'axios';

interface PPPoEClient {
  id: string;
  name: string;
  password: string;
  comment?: string;
  profile?: string;
  contract?: string;
  ipAddress?: string;
  isActive: boolean;
  router?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ClientSession {
  id: string;
  name: string;
  address: string;
  uptime: string;
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
}

interface ClientStats {
  totalBytes: number;
  totalPackets: number;
  connectionTime: string;
  lastSeen: string;
}

export const ClientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canManageClients, canControlClients, hasPermission } = usePermissions();
  
  const [client, setClient] = useState<PPPoEClient | null>(null);
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchClientDetails();
      fetchClientSessions();
      fetchClientStats();
    }
  }, [id]);

  const fetchClientDetails = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/pppoe/clients/${id}`);
      setClient(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar cliente');
    }
  };

  const fetchClientSessions = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/pppoe/clients/${id}/sessions`);
      setSessions(response.data);
    } catch (err: any) {
      console.error('Error loading sessions:', err);
    }
  };

  const fetchClientStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/pppoe/clients/${id}/stats`);
      setStats(response.data);
    } catch (err: any) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (action: 'activate' | 'suspend' | 'block' | 'unblock') => {
    if (!client) return;

    setActionLoading(action);
    try {
      let endpoint = '';
      switch (action) {
        case 'activate':
          endpoint = `/api/pppoe/clients/${id}/activate`;
          break;
        case 'suspend':
          endpoint = `/api/pppoe/clients/${id}/suspend`;
          break;
        case 'block':
          endpoint = `/api/pppoe/clients/${id}/block`;
          break;
        case 'unblock':
          endpoint = `/api/pppoe/clients/${id}/unblock`;
          break;
      }

      await axios.post(`${import.meta.env.VITE_BACKEND_URL}${endpoint}`);
      await fetchClientDetails();
    } catch (err: any) {
      setError(err.response?.data?.message || `Error al ${action} cliente`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async () => {
    if (!client || !window.confirm('¿Estás seguro de que quieres resetear la contraseña?')) {
      return;
    }

    setActionLoading('reset');
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/pppoe/clients/${id}/reset-password`);
      await fetchClientDetails();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al resetear contraseña');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnectSessions = async () => {
    if (!window.confirm('¿Estás seguro de que quieres desconectar todas las sesiones?')) {
      return;
    }

    setActionLoading('disconnect');
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/pppoe/clients/${id}/sessions`);
      await fetchClientSessions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al desconectar sesiones');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      return;
    }

    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/pppoe/clients/${id}`);
      navigate('/dashboard/clients');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar cliente');
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? 'Activo' : 'Inactivo'}
      </Badge>
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/clients')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-40 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/clients')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Cliente no encontrado</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/clients')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div className="flex items-center space-x-3">
            <User className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{client.name}</h1>
              <p className="text-slate-600">{client.comment || 'Sin comentarios'}</p>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {/* Control Actions */}
          {canControlClients() && (
            <>
              {client.isActive ? (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('suspend')}
                  disabled={actionLoading === 'suspend'}
                >
                  {actionLoading === 'suspend' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600 mr-2"></div>
                  ) : (
                    <Pause className="mr-2 h-4 w-4" />
                  )}
                  Suspender
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('activate')}
                  disabled={actionLoading === 'activate'}
                >
                  {actionLoading === 'activate' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600 mr-2"></div>
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Activar
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={handleResetPassword}
                disabled={actionLoading === 'reset'}
              >
                {actionLoading === 'reset' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600 mr-2"></div>
                ) : (
                  <KeyRound className="mr-2 h-4 w-4" />
                )}
                Resetear Password
              </Button>
            </>
          )}
          
          {canManageClients() && (
            <>
              <Button asChild variant="outline">
                <Link to={`/dashboard/clients/${id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="sessions">Sesiones</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Información del Cliente</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Nombre:</span>
                  <span className="text-sm font-mono">{client.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Estado:</span>
                  {getStatusBadge(client.isActive)}
                </div>
                {client.ipAddress && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">IP:</span>
                    <span className="text-sm font-mono">{client.ipAddress}</span>
                  </div>
                )}
                {client.profile && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Perfil:</span>
                    <span className="text-sm">{client.profile}</span>
                  </div>
                )}
                {client.contract && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Contrato:</span>
                    <span className="text-sm">{client.contract}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Información Técnica</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.router && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Router:</span>
                    <span className="text-sm">{client.router.name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Creado:</span>
                  <span className="text-sm">
                    {new Date(client.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Actualizado:</span>
                  <span className="text-sm">
                    {new Date(client.updatedAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ID:</span>
                  <span className="text-sm font-mono">{client.id}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Sesiones Activas</span>
                  </CardTitle>
                  <CardDescription>
                    Sesiones PPPoE actualmente conectadas
                  </CardDescription>
                </div>
                {canControlClients() && sessions.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleDisconnectSessions}
                    disabled={actionLoading === 'disconnect'}
                  >
                    {actionLoading === 'disconnect' ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600 mr-2"></div>
                    ) : (
                      <WifiOff className="mr-2 h-4 w-4" />
                    )}
                    Desconectar Todo
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Wifi className="h-5 w-5 text-green-500" />
                          <div>
                            <h3 className="font-medium">{session.name}</h3>
                            <p className="text-sm text-slate-600">{session.address}</p>
                          </div>
                        </div>
                        <Badge variant="default">Conectado</Badge>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm">
                        <div>
                          <span className="font-medium">Tiempo:</span>
                          <p>{session.uptime}</p>
                        </div>
                        <div>
                          <span className="font-medium">RX:</span>
                          <p>{formatBytes(session.rxBytes)} ({session.rxPackets} paquetes)</p>
                        </div>
                        <div>
                          <span className="font-medium">TX:</span>
                          <p>{formatBytes(session.txBytes)} ({session.txPackets} paquetes)</p>
                        </div>
                        <div>
                          <span className="font-medium">Total:</span>
                          <p>{formatBytes(session.rxBytes + session.txBytes)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <WifiOff className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-slate-600">No hay sesiones activas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {stats ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Estadísticas de Uso</span>
                </CardTitle>
                <CardDescription>
                  Estadísticas históricas del cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatBytes(stats.totalBytes)}
                    </div>
                    <p className="text-sm text-slate-600">Datos Totales</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.totalPackets.toLocaleString()}
                    </div>
                    <p className="text-sm text-slate-600">Paquetes Totales</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.connectionTime}
                    </div>
                    <p className="text-sm text-slate-600">Tiempo Conectado</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.lastSeen}
                    </div>
                    <p className="text-sm text-slate-600">Última Conexión</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-600">No hay estadísticas disponibles</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};