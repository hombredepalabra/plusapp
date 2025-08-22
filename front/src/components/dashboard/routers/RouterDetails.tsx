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
  TestTube, 
  Trash2, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
  Thermometer,
  Zap,
  Clock,
  Network,
  Settings
} from 'lucide-react';
import { usePermissions } from '../../../hooks/usePermissions';
import { Router, RouterInterface, RouterResource } from '../../../types/router';
import axios from 'axios';

export const RouterDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canManageRouters, hasPermission } = usePermissions();
  
  const [router, setRouter] = useState<Router | null>(null);
  const [interfaces, setInterfaces] = useState<RouterInterface[]>([]);
  const [resources, setResources] = useState<RouterResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRouterDetails();
      fetchInterfaces();
      fetchResources();
    }
  }, [id]);

  const fetchRouterDetails = async () => {
    try {
      const response = await axios.get(`/api/routers/${id}`);
      setRouter(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar router');
    }
  };

  const fetchInterfaces = async () => {
    try {
      const response = await axios.get(`/api/routers/${id}/interfaces`);
      setInterfaces(response.data);
    } catch (err: any) {
      console.error('Error loading interfaces:', err);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await axios.get(`/api/routers/${id}/resources`);
      setResources(response.data);
    } catch (err: any) {
      console.error('Error loading resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!router) return;

    setTesting(true);
    try {
      await axios.post(`/api/routers/${id}/test`);
      await fetchRouterDetails(); // Refresh status
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al probar conexión');
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este router?')) {
      return;
    }

    try {
      await axios.delete(`/api/routers/${id}`);
      navigate('/dashboard/routers');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar router');
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-5 w-5 text-green-500" />;
      case 'offline':
        return <WifiOff className="h-5 w-5 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Settings className="h-5 w-5 text-slate-400" />;
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (uptime: string) => {
    // Assuming uptime comes in format like "1w2d3h4m5s"
    return uptime;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/routers')}>
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

  if (!router) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/routers')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Router no encontrado</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/routers')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div className="flex items-center space-x-3">
            {getStatusIcon(router.status)}
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{router.name}</h1>
              <p className="text-slate-600">{router.uri}</p>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          {hasPermission('routers.test') && (
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing}
            >
              {testing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600 mr-2"></div>
                  Probando...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Probar
                </>
              )}
            </Button>
          )}
          {canManageRouters() && (
            <>
              <Button asChild variant="outline">
                <Link to={`/dashboard/routers/${id}/edit`}>
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
          <TabsTrigger value="interfaces">Interfaces</TabsTrigger>
          <TabsTrigger value="resources">Recursos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Status and Basic Info */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Estado del Router</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Estado:</span>
                  {getStatusBadge(router.status, router.isActive)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">URI:</span>
                  <span className="text-sm font-mono">{router.uri}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Usuario:</span>
                  <span className="text-sm">{router.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Activo:</span>
                  <Badge variant={router.isActive ? "default" : "secondary"}>
                    {router.isActive ? 'Sí' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Información General</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {router.branch && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sucursal:</span>
                    <span className="text-sm">{router.branch.name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Creado:</span>
                  <span className="text-sm">
                    {new Date(router.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Actualizado:</span>
                  <span className="text-sm">
                    {new Date(router.updatedAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ID:</span>
                  <span className="text-sm font-mono">{router.id}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Resources */}
          {resources && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cpu className="h-5 w-5" />
                  <span>Recursos del Sistema</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <Cpu className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">CPU</p>
                      <p className="text-2xl font-bold">{resources.cpuLoad}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <MemoryStick className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Memoria</p>
                      <p className="text-2xl font-bold">
                        {Math.round((resources.memoryUsed / resources.memoryTotal) * 100)}%
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatBytes(resources.memoryUsed)} / {formatBytes(resources.memoryTotal)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                      <HardDrive className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Disco</p>
                      <p className="text-2xl font-bold">
                        {Math.round((resources.diskUsed / resources.diskTotal) * 100)}%
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatBytes(resources.diskUsed)} / {formatBytes(resources.diskTotal)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Uptime</p>
                      <p className="text-lg font-bold">{formatUptime(resources.uptime)}</p>
                    </div>
                  </div>
                </div>

                {(resources.temperature || resources.voltage) && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="grid gap-6 md:grid-cols-2">
                      {resources.temperature && (
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                            <Thermometer className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Temperatura</p>
                            <p className="text-2xl font-bold">{resources.temperature}°C</p>
                          </div>
                        </div>
                      )}

                      {resources.voltage && (
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                            <Zap className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Voltaje</p>
                            <p className="text-2xl font-bold">{resources.voltage}V</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="interfaces" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Network className="h-5 w-5" />
                <span>Interfaces de Red</span>
              </CardTitle>
              <CardDescription>
                Estado y estadísticas de las interfaces del router
              </CardDescription>
            </CardHeader>
            <CardContent>
              {interfaces.length > 0 ? (
                <div className="space-y-4">
                  {interfaces.map((iface) => (
                    <div key={iface.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            iface.status === 'up' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <h3 className="font-medium">{iface.name}</h3>
                          <Badge variant="outline">{iface.type}</Badge>
                        </div>
                        <Badge variant={iface.status === 'up' ? 'default' : 'secondary'}>
                          {iface.status === 'up' ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm">
                        {iface.macAddress && (
                          <div>
                            <span className="font-medium">MAC:</span>
                            <p className="font-mono">{iface.macAddress}</p>
                          </div>
                        )}
                        {iface.mtu && (
                          <div>
                            <span className="font-medium">MTU:</span>
                            <p>{iface.mtu}</p>
                          </div>
                        )}
                        <div>
                          <span className="font-medium">RX:</span>
                          <p>{formatBytes(iface.rxBytes)} ({iface.rxPackets} paquetes)</p>
                        </div>
                        <div>
                          <span className="font-medium">TX:</span>
                          <p>{formatBytes(iface.txBytes)} ({iface.txPackets} paquetes)</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Network className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-slate-600">No hay interfaces disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          {resources ? (
            <Card>
              <CardHeader>
                <CardTitle>Recursos Detallados del Sistema</CardTitle>
                <CardDescription>
                  Información completa sobre el uso de recursos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Resource bars or detailed charts could go here */}
                  <div className="text-center py-8 text-slate-600">
                    <Activity className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p>Gráficos detallados de recursos próximamente</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Activity className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-600">No hay datos de recursos disponibles</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};