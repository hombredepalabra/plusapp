import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Alert, AlertDescription } from '../../ui/alert';
import { ArrowLeft, Save, TestTube, AlertTriangle, CheckCircle } from 'lucide-react';
import { usePermissions } from '../../../hooks/usePermissions';
import type { Router, UpdateRouterRequest, Branch } from '../../../types/router';
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

export const EditRouter: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canManageRouters } = usePermissions();
  const hasRouterPermission = canManageRouters()
  const [router, setRouter] = useState<Router | null>(null);
  const [formData, setFormData] = useState<UpdateRouterRequest>({});
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchRouterDetails = useCallback(async () => {
    try {
      const response = await axios.get(`/api/routers/${id}`);
      const r = response.data;
      const mappedRouter: Router = {
        id: r.id,
        name: r.name,
        uri: r.uri,
        username: r.username,
        password: '',
        branchId: r.branch_id,
        branch: r.branch,
        isActive: r.is_active,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      };
      setRouter(mappedRouter);
      setFormData({
        name: mappedRouter.name,
        uri: mappedRouter.uri,
        username: mappedRouter.username,
        password: '', // Don't pre-fill password for security
        branchId: mappedRouter.branchId,
        isActive: mappedRouter.isActive
      });
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchBranches = useCallback(async () => {
    try {
      const response = await axios.get('/api/branches');
      const data = response.data?.branches || [];
      setBranches(data);
    } catch (error) {
      setError(getErrorMessage(error));
      setBranches([{ id: 1, name: 'Principal', location: 'Oficina Central', isActive: true, createdAt: '', updatedAt: '' }]);
    }
  }, []);

  useEffect(() => {
    if (!hasRouterPermission) {
      navigate('/dashboard/routers');
      return;
    }
    
    if (id) {
      fetchRouterDetails();
      fetchBranches();
    }
  }, [id, hasRouterPermission, navigate, fetchRouterDetails, fetchBranches]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : name === 'branchId' 
          ? parseInt(value) 
          : value
    }));
  };

  const handleTestConnection = async () => {
    if (!formData.uri || !formData.username || !formData.password) {
      setError('Completa URI, usuario y contraseña para probar la conexión');
      return;
    }

    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const response = await axios.post('/api/routers/test-connection', {
        uri: formData.uri,
        username: formData.username,
        password: formData.password
      });

      setTestResult({
        success: true,
        message: response.data.message || 'Conexión exitosa'
      });
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.uri || !formData.username) {
      setError('Nombre, URI y usuario son obligatorios');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Only send fields that have values (don't send empty password)
      const updateData: any = {};
      if (formData.name !== router?.name) updateData.name = formData.name;
      if (formData.uri !== router?.uri) updateData.uri = formData.uri;
      if (formData.username !== router?.username) updateData.username = formData.username;
      if (formData.password) updateData.password = formData.password; // Only update if new password provided
      if (formData.branchId !== router?.branchId) updateData.branch_id = formData.branchId;
      if (formData.isActive !== router?.isActive) updateData.is_active = formData.isActive;

      await axios.put(`/api/routers/${id}`, updateData);
      setSuccess('Router actualizado exitosamente');
      
      setTimeout(() => {
        navigate(`/dashboard/routers/${id}`);
      }, 1500);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
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
          <div className="h-96 bg-slate-200 rounded"></div>
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
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate(`/dashboard/routers/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Editar Router</h1>
          <p className="text-slate-600">Actualiza la configuración de {router.name}</p>
        </div>
      </div>

      {/* Success Alert */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Test Result Alert */}
      {testResult && (
        <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {testResult.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
            {testResult.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Router</CardTitle>
          <CardDescription>
            Actualiza los datos de conexión del router MikroTik
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Router *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  placeholder="Ej: Router Principal"
                  required
                />
              </div>

              {/* Sucursal */}
              <div className="space-y-2">
                <Label htmlFor="branchId">Sucursal *</Label>
                <select
                  id="branchId"
                  name="branchId"
                  value={formData.branchId || ''}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} {branch.location && `(${branch.location})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* URI */}
              <div className="space-y-2">
                <Label htmlFor="uri">URI de Conexión *</Label>
                <Input
                  id="uri"
                  name="uri"
                  value={formData.uri || ''}
                  onChange={handleInputChange}
                  placeholder="192.168.1.1:8728"
                  required
                />
                <p className="text-xs text-slate-500">
                  Formato: IP:Puerto (ejemplo: 192.168.1.1:8728)
                </p>
              </div>

              {/* Usuario */}
              <div className="space-y-2">
                <Label htmlFor="username">Usuario *</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username || ''}
                  onChange={handleInputChange}
                  placeholder="admin"
                  required
                />
              </div>

              {/* Contraseña */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password || ''}
                  onChange={handleInputChange}
                  placeholder="Deja vacío para mantener la contraseña actual"
                />
                <p className="text-xs text-slate-500">
                  Solo completa este campo si quieres cambiar la contraseña
                </p>
              </div>

              {/* Estado */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive ?? true}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="isActive">Router activo</Label>
                </div>
                <p className="text-xs text-slate-500">
                  Los routers inactivos no serán monitoreados ni utilizados
                </p>
              </div>
            </div>

            {/* Connection Test */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium">Probar Conexión</h3>
                  <p className="text-sm text-slate-600">
                    Verifica que los datos de conexión sean correctos
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing || !formData.uri || !formData.username || !formData.password}
                >
                  {testing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600 mr-2"></div>
                      Probando...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Probar Conexión
                    </>
                  )}
                </Button>
              </div>
              {!formData.password && (
                <p className="text-xs text-slate-500 mb-4">
                  Para probar la conexión, necesitas ingresar la contraseña actual o una nueva
                </p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/dashboard/routers/${id}`)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};