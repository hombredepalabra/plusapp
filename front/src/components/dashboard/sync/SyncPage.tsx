import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { 
  RefreshCw, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  History
} from 'lucide-react';
import { usePermissions } from '../../../hooks/usePermissions';
import axios from 'axios';

interface SyncStatus {
  is_running: boolean;
  last_sync: string | null;
  next_sync: string | null;
  success_count: number;
  error_count: number;
  total_routers: number;
}

interface SyncLog {
  id: number;
  router_id: number;
  router_name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  duration: number;
  timestamp: string;
}

export const SyncPage: React.FC = () => {
  const { canManageUsers } = usePermissions(); // Using canManageUsers for admin check
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchSyncStatus();
    fetchSyncLogs();
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const response = await axios.get('/api/sync/status');
      if (response.data.success) {
        setSyncStatus(response.data.status);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar estado de sincronización');
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncLogs = async () => {
    try {
      const response = await axios.get('/api/sync/logs?limit=20');
      if (response.data.success) {
        setSyncLogs(response.data.logs);
      }
    } catch (err: any) {
      console.error('Error loading sync logs:', err);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      await axios.post('/api/sync/all');
      await fetchSyncStatus();
      await fetchSyncLogs();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al sincronizar routers');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncRouter = async (routerId: number) => {
    setSyncing(true);
    try {
      await axios.post(`/api/sync/manual/${routerId}`);
      await fetchSyncStatus();
      await fetchSyncLogs();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al sincronizar router');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Exitoso</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendiente</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  if (!canManageUsers()) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>No tienes permisos para gestionar la sincronización</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Sincronización</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-40 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sincronización</h1>
          <p className="text-slate-600">Gestiona la sincronización automática de routers</p>
        </div>
        <Button 
          onClick={handleSyncAll}
          disabled={syncing}
          className="flex items-center space-x-2"
        >
          {syncing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Sincronizando...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>Sincronizar Todo</span>
            </>
          )}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Sync Status Overview */}
      {syncStatus && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center space-x-2">
                {syncStatus.is_running ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Activo</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span>Inactivo</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exitosos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{syncStatus.success_count}</div>
              <p className="text-xs text-muted-foreground">
                de {syncStatus.total_routers} routers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con Errores</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{syncStatus.error_count}</div>
              <p className="text-xs text-muted-foreground">
                routers con problemas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Sync</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {syncStatus.last_sync 
                  ? new Date(syncStatus.last_sync).toLocaleString('es-ES')
                  : 'Nunca'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {syncStatus.next_sync && `Próxima: ${new Date(syncStatus.next_sync).toLocaleString('es-ES')}`}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sync Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Historial de Sincronización</span>
          </CardTitle>
          <CardDescription>
            Últimas {syncLogs.length} sincronizaciones realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {syncLogs.length > 0 ? (
              syncLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {log.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {log.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                        {log.status === 'pending' && <Clock className="h-5 w-5 text-yellow-500" />}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">{log.router_name}</h3>
                        <p className="text-sm text-slate-600">{log.message}</p>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(log.status)}
                        <span className="text-xs text-slate-500">
                          {log.duration}ms
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(log.timestamp).toLocaleString('es-ES')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <History className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-600">No hay logs de sincronización disponibles</p>
                <Button 
                  onClick={handleSyncAll}
                  disabled={syncing}
                  className="mt-4"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Ejecutar Primera Sincronización
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuración de Sincronización</span>
          </CardTitle>
          <CardDescription>
            Configuraciones avanzadas del sistema de sincronización
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Intervalo de Sincronización</label>
              <p className="text-sm text-slate-600">Cada 30 minutos</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Timeout por Router</label>
              <p className="text-sm text-slate-600">30 segundos</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reintentos Automáticos</label>
              <p className="text-sm text-slate-600">3 intentos</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notificaciones</label>
              <p className="text-sm text-slate-600">Solo en errores</p>
            </div>
          </div>
          <div className="mt-6">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Configurar Parámetros
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};