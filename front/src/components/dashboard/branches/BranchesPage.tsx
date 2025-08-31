import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Alert, AlertDescription } from '../../ui/alert';
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building, 
  MapPin,
  Router,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { usePermissions } from '../../../hooks/usePermissions';
import { branchService } from '../../../services/branchService';
import type { BranchData } from '../../../types/branch';

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const err = error as any;
    return err.response?.data?.error || err.message || 'Error de conexión';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error desconocido';
};

export const BranchesPage: React.FC = () => {
  const { canManageUsers } = usePermissions();
  
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const fetchBranches = useCallback(async () => {
    try {
      const response = await axios.get(`/api/branches?page=${currentPage}&per_page=20&status=${status}`);
      if (response.data.success) {
        setBranches(response.data.branches);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [currentPage, status]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleDelete = async (branchId: number) => {
    const branch = branches.find(b => b.id === branchId);
    if (branch && branch.routers_count > 0) {
      setError(`No se puede eliminar la sucursal "${branch.name}" porque tiene ${branch.routers_count} routers asignados. Primero reasigna los routers a otra sucursal.`);
      return;
    }

    const confirmMessage =
      status === 'active'
        ? '¿Estás seguro de que quieres desactivar esta sucursal?'
        : '¿Estás seguro de que quieres eliminar permanentemente esta sucursal?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await branchService.deleteBranch(branchId);
      fetchBranches();
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (branch.location && branch.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!canManageUsers()) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>No tienes permisos para gestionar sucursales</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Gestión de Sucursales</h1>
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
          <h1 className="text-3xl font-bold text-slate-900">Gestión de Sucursales</h1>
          <p className="text-slate-600">Administra las sucursales y ubicaciones</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/branches/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Sucursal
          </Link>
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Lista de Sucursales</span>
          </CardTitle>
          <CardDescription>
            Total de sucursales: {branches.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={status}
            onValueChange={(val) => {
              setStatus(val as 'active' | 'inactive');
              setCurrentPage(1);
            }}
            className="mb-6"
          >
            <TabsList>
              <TabsTrigger value="active">Activas</TabsTrigger>
              <TabsTrigger value="inactive">Inactivas</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar sucursales por nombre o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Branches Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBranches.length > 0 ? (
              filteredBranches.map((branch) => (
                <Card key={branch.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Building className="h-5 w-5 text-blue-600" />
                        <span>{branch.name}</span>
                      </CardTitle>
                      <div className="flex space-x-1">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/dashboard/branches/${branch.id}/edit`}>
                            <Edit className="h-3 w-3" />
                          </Link>
                        </Button>
                          <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(branch.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {branch.location && (
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4" />
                        <span>{branch.location}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Router className="h-4 w-4" />
                        <span>{branch.routers_count ?? 0} routers</span>
                      </div>
                      {branch.is_active ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activa</Badge>
                      ) : (
                        <Badge variant="secondary">Inactiva</Badge>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      <span>Creada: {new Date(branch.created_at).toLocaleDateString('es-ES')}</span>
                    </div>

                    <div className="pt-2">
                      <Button asChild variant="outline" className="w-full" size="sm">
                        <Link to={`/dashboard/branches/${branch.id}`}>
                          Ver Detalles
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <Building className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-600">
                  {searchTerm ? 'No se encontraron sucursales' : 'No hay sucursales registradas'}
                </p>
                {!searchTerm && (
                  <Button asChild className="mt-4">
                    <Link to="/dashboard/branches/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Primera Sucursal
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-slate-600">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};