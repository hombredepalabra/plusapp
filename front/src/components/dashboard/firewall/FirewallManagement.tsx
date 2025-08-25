import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { 
  Shield,
  Search,
  Plus,
  Ban,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Globe,
  Clock
} from 'lucide-react';
import { usePermissions } from '../../../hooks/usePermissions';
import axios from 'axios';
import { toast } from 'sonner';
import { firewallService } from '../../../services/firewallService';
import { routerService } from '../../../services/routerService';

interface FirewallRule {
  id: string;
  routerId: string;
  routerName: string;
  ipAddress: string;
  comment?: string;
  creationDate: string;
  isActive: boolean;
  protocol?: string;
  port?: string;
  action?: string;
  chain?: string;
}

interface BlockIPForm {
  ipAddress: string;
  comment: string;
  routerId: string;
}

export const FirewallManagement: React.FC = () => {
  const { hasPermission, canManageFirewall } = usePermissions();
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [routers, setRouters] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRouter, setSelectedRouter] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<BlockIPForm>({
    ipAddress: '',
    comment: '',
    routerId: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [unblocking, setUnblocking] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchFirewallRules();
    fetchRouters();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRouter]);

  const fetchFirewallRules = async () => {
    try {
      const data = await firewallService.getRules();
      setRules(data);
      setError(null);
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message
        : undefined;
      const fallback = 'Error al cargar reglas de firewall';
      setError(message || fallback);
      toast.error(message || fallback);
    } finally {
      setLoading(false);
    }
  };

  const fetchRouters = async () => {
    try {
      const data = await routerService.getRouters();
      setRouters(data.filter(r => r.isActive));
    } catch (err: unknown) {
      console.error('Error loading routers:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateIP = (ip: string): boolean => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  const handleBlockIP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateIP(formData.ipAddress)) {
      setError('Dirección IP inválida');
      return;
    }

    if (!formData.routerId) {
      setError('Debe seleccionar un router');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await firewallService.blockIP({
        ipAddress: formData.ipAddress.trim(),
        comment: formData.comment.trim() || undefined,
        routerId: formData.routerId
      });

      toast.success('IP bloqueada correctamente');
      setFormData({ ipAddress: '', comment: '', routerId: '' });
      setShowAddForm(false);
      await fetchFirewallRules();
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message
        : undefined;
      toast.error(message || 'Error al bloquear IP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnblockIP = async (ruleId: string, ipAddress: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres desbloquear la IP ${ipAddress}?`)) {
      return;
    }

    setUnblocking(ruleId);
    try {
      await firewallService.unblockIP(ipAddress);
      toast.success('IP desbloqueada correctamente');
      await fetchFirewallRules();
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message
        : undefined;
      toast.error(message || 'Error al desbloquear IP');
    } finally {
      setUnblocking(null);
    }
  };

  // Filter rules based on search and router selection
  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.ipAddress.includes(searchTerm) ||
                         rule.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.routerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRouter = !selectedRouter || rule.routerId === selectedRouter;

    return matchesSearch && matchesRouter;
  });

  const paginatedRules = filteredRules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalRules = rules.length;
  const activeRules = rules.filter(rule => rule.isActive).length;
  const uniqueRouters = new Set(rules.map(rule => rule.routerId)).size;
  const totalPages = Math.max(1, Math.ceil(filteredRules.length / itemsPerPage));

  if (!hasPermission('firewall.read')) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No tienes permisos para ver las reglas de firewall</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestión de Firewall</h1>
          <p className="text-slate-600">
            Administrar reglas de bloqueo de IP en los routers
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchFirewallRules} disabled={loading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          {canManageFirewall() && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Bloquear IP
            </Button>
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

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reglas Totales</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalRules}</div>
            <p className="text-xs text-muted-foreground">
              Reglas de firewall configuradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reglas Activas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeRules}</div>
            <p className="text-xs text-muted-foreground">
              IPs bloqueadas activamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Routers</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{uniqueRouters}</div>
            <p className="text-xs text-muted-foreground">
              Routers con reglas activas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add IP Form */}
      {showAddForm && canManageFirewall() && (
        <Card>
          <CardHeader>
            <CardTitle>Bloquear Nueva IP</CardTitle>
            <CardDescription>
              Agregar una dirección IP a la lista de bloqueo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBlockIP} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="ipAddress">Dirección IP *</Label>
                  <Input
                    id="ipAddress"
                    name="ipAddress"
                    value={formData.ipAddress}
                    onChange={handleInputChange}
                    placeholder="192.168.1.100"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="routerId">Router *</Label>
                  <select
                    id="routerId"
                    name="routerId"
                    value={formData.routerId}
                    onChange={handleInputChange}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Seleccionar router...</option>
                    {routers.map((router) => (
                      <option key={router.id} value={router.id}>
                        {router.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="comment">Comentario</Label>
                  <Input
                    id="comment"
                    name="comment"
                    value={formData.comment}
                    onChange={handleInputChange}
                    placeholder="Razón del bloqueo..."
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Bloqueando...
                    </>
                  ) : (
                    <>
                      <Ban className="mr-2 h-4 w-4" />
                      Bloquear IP
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ ipAddress: '', comment: '', routerId: '' });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="firewall-search" className="sr-only">Buscar reglas</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firewall-search"
                  placeholder="Buscar por IP, comentario o router..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-64">
              <Label htmlFor="firewall-router" className="sr-only">Filtrar por router</Label>
              <select
                id="firewall-router"
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

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Reglas de Firewall</CardTitle>
          <CardDescription>
            Mostrando {paginatedRules.length} de {filteredRules.length} reglas filtradas ({totalRules} totales)
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
                </div>
              ))}
            </div>
          ) : filteredRules.length > 0 ? (
            <div className="space-y-4">
              {paginatedRules.map((rule) => (
                <div key={rule.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Ban className="h-5 w-5 text-red-500" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-mono font-medium text-lg">{rule.ipAddress}</h3>
                          <Badge variant={rule.isActive ? "destructive" : "secondary"}>
                            {rule.isActive ? 'Bloqueada' : 'Inactiva'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-slate-600">
                          <span className="flex items-center space-x-1">
                            <Globe className="h-3 w-3" />
                            <span>{rule.routerName}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(rule.creationDate).toLocaleDateString('es-ES')}</span>
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-600">
                          {rule.chain && <Badge variant="outline">{rule.chain}</Badge>}
                          {rule.action && <Badge variant="outline">{rule.action}</Badge>}
                          {rule.protocol && (
                            <Badge variant="outline">{rule.protocol.toUpperCase()}</Badge>
                          )}
                          {rule.port && <Badge variant="outline">Puerto {rule.port}</Badge>}
                        </div>
                        {rule.comment && (
                          <p className="text-sm text-slate-600 mt-1">{rule.comment}</p>
                        )}
                      </div>
                    </div>
                    
                    {canManageFirewall() && rule.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblockIP(rule.id, rule.ipAddress)}
                        disabled={unblocking === rule.id}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        {unblocking === rule.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-2"></div>
                            Desbloqueando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-3 w-3" />
                            Desbloquear
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No hay reglas de firewall
              </h3>
              <p className="text-slate-600 mb-4">
                {searchTerm || selectedRouter 
                  ? 'No se encontraron reglas que coincidan con los filtros'
                  : 'No hay IPs bloqueadas en este momento'
                }
              </p>
              {canManageFirewall() && !searchTerm && !selectedRouter && (
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Primera Regla
                </Button>
              )}
            </div>
          )}
          {filteredRules.length > 0 && (
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