import React, { useState, useEffect } from 'react';
import { pppoeService } from '../../services/pppoeService';
import type { PPPoEClient } from '../../types/pppoe';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search, RefreshCw, Wifi, User } from 'lucide-react';

export const PPPoEClients: React.FC = () => {
  const [clients, setClients] = useState<PPPoEClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadClients = async (page = 1, sync = false) => {
    try {
      setLoading(true);
      const response = await pppoeService.getClients(page, 50, sync);
      setClients(response.clients);
      setCurrentPage(response.current_page);
      setTotalPages(response.pages);
      setTotal(response.total);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadClients();
      return;
    }
    
    try {
      setLoading(true);
      const results = await pppoeService.searchClients(searchQuery);
      setClients(results);
      setTotalPages(1);
      setTotal(results.length);
    } catch (error) {
      console.error('Error searching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clientes PPPoE</h1>
          <p className="text-slate-600">Gestión de clientes PPPoE del sistema</p>
        </div>
        <Button 
          onClick={() => loadClients(1, true)}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Sincronizar
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nombre, IP, contrato..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            Buscar
          </Button>
        </div>

        <div className="mb-4 text-sm text-slate-600">
          Total: {total} clientes
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
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">IP</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Perfil</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Contrato</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <div>
                          <div className="font-medium text-slate-900">{client.name}</div>
                          {client.comment && (
                            <div className="text-sm text-slate-500">{client.comment}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4 text-slate-400" />
                        <span className="font-mono text-sm">{client.ip}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary">{client.profile}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-600">{client.contract || '-'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={client.is_active ? "default" : "destructive"}>
                        {client.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-500">
                        {client.created_at ? new Date(client.created_at).toLocaleDateString() : '-'}
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
              onClick={() => loadClients(currentPage - 1)}
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
              onClick={() => loadClients(currentPage + 1)}
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