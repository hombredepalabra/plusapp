import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Label } from '../ui/label';
import { 
  Activity,
  Search,
  Wifi,
  WifiOff,
  Router,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { pppoeService } from '../../services/pppoeService';
import { routerService } from '../../services/routerService';
interface ActiveSession {
  id: string;
  clientName: string;
  clientId?: string;
  address: string;
  uptime: string;
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
  routerId: string;
  routerName: string;
  callingStationId?: string;
  calledStationId?: string;
}

export const SessionManagement: React.FC = () => {
  const { hasPermission, canControlClients } = usePermissions();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRouter, setSelectedRouter] = useState<string>('');
  const [routers, setRouters] = useState<{id: string, name: string}[]>([]);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchSessions();
    fetchRouters();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRouter]);

  const fetchSessions = async () => {
    try {
      const data = await pppoeService.getActiveSessions();
      setSessions(data);
      setError(null);
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      const message = error.response?.data?.message || 'Error al cargar sesiones';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRouters = async () => {
    try {
      const data = await routerService.getRouters();
      setRouters(data);
    } catch (err: unknown) {
      console.error('Error loading routers:', err);
    }
  };

  const handleDisconnectSession = async (sessionId: string, clientId?: string) => {
    if (!canControlClients() || !window.confirm('¿Estás seguro de que quieres desconectar esta sesión?')) {
      return;
    }

    setDisconnecting(sessionId);
    try {
      // If we have clientId, use the specific client endpoint
      if (clientId) {
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/pppoe/clients/${clientId}/sessions`);
      } else {
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/pppoe/sessions/${sessionId}`);
      }
      toast.success('Sesión desconectada');
      await fetchSessions();
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      const message = error.response?.data?.message || 'Error al desconectar sesión';
      setError(message);
      toast.error(message);
    } finally {
      setDisconnecting(null);
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
    return uptime;
  };

  // Filter sessions based on search and router selection
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.address.includes(searchTerm) ||
                         session.routerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRouter = !selectedRouter || session.routerId === selectedRouter;
    
    return matchesSearch && matchesRouter;
  });

  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalSessions = sessions.length;
  const totalTraffic = sessions.reduce((acc, session) => acc + session.rxBytes + session.txBytes, 0);
  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / itemsPerPage));

  if (!hasPermission('pppoe.read')) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No tienes permisos para ver las sesiones</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sesiones Activas</h1>
          <p className="text-slate-600">
            Monitoreo de conexiones PPPoE en tiempo real
          </p>
        </div>
        <Button onClick={fetchSessions} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sesiones Activas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              Conexiones PPPoE actuales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tráfico Total</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatBytes(totalTraffic)}</div>
            <p className="text-xs text-muted-foreground">
              Datos transferidos en sesiones activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Routers Activos</CardTitle>
            <Router className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {new Set(sessions.map(s => s.routerId)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Routers con sesiones activas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="session-search" className="sr-only">Buscar sesiones</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="session-search"
                  placeholder="Buscar por cliente, IP o router..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-64">
              <Label htmlFor="session-router" className="sr-only">Filtrar por router</Label>
              <select
                id="session-router"
                value={selectedRouter}
                onChange={(e) => setSelectedRouter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Todos los routers</option>
                {routers.map((router) => (
                  <option key={router.id} value={router.id}>
                    {router.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Sesiones</CardTitle>
          <CardDescription>
            Mostrando {paginatedSessions.length} de {filteredSessions.length} sesiones filtradas ({totalSessions} totales)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
                      <div className="w-32 h-4 bg-slate-200 rounded"></div>
                    </div>
                    <div className="w-16 h-6 bg-slate-200 rounded"></div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="w-24 h-4 bg-slate-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="space-y-4">
              {paginatedSessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Wifi className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{session.clientName}</h3>
                          {session.clientId && (
                            <Link to={`/dashboard/clients/${session.clientId}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">
                          {session.address} • {session.routerName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">
                        <Activity className="mr-1 h-3 w-3" />
                        {formatUptime(session.uptime)}
                      </Badge>
                      {canControlClients() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisconnectSession(session.id, session.clientId)}
                          disabled={disconnecting === session.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {disconnecting === session.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-500">Descarga:</span>
                      <p className="font-mono">
                        {formatBytes(session.rxBytes)} ({session.rxPackets.toLocaleString()} paquetes)
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-500">Subida:</span>
                      <p className="font-mono">
                        {formatBytes(session.txBytes)} ({session.txPackets.toLocaleString()} paquetes)
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-500">Total:</span>
                      <p className="font-mono font-medium">
                        {formatBytes(session.rxBytes + session.txBytes)}
                      </p>
                    </div>
                    {session.callingStationId && (
                      <div>
                        <span className="font-medium text-slate-500">MAC:</span>
                        <p className="font-mono text-xs">
                          {session.callingStationId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <WifiOff className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No hay sesiones activas
              </h3>
              <p className="text-slate-600">
                {searchTerm || selectedRouter 
                  ? 'No se encontraron sesiones que coincidan con los filtros'
                  : 'No hay conexiones PPPoE activas en este momento'
                }
              </p>
            </div>
          )}
          {filteredSessions.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
