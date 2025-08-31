import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Alert, AlertDescription } from '../../ui/alert';
import { ArrowLeft, Save, TestTube, AlertTriangle, CheckCircle } from 'lucide-react';
import { usePermissions } from '../../../hooks/usePermissions';
import type { CreateRouterRequest, Branch } from '../../../types/router';
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

export const CreateRouter: React.FC = () => {
  const navigate = useNavigate();
  const { canManageRouters } = usePermissions();
  const hasRouterPermission = canManageRouters();
  const [formData, setFormData] = useState<CreateRouterRequest>({
    name: '',
    uri: '',
    username: 'admin',
    password: '',
    branchId: 1
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!hasRouterPermission) {
      navigate('/dashboard/routers');
      return;
    }
    fetchBranches();
  }, [navigate, hasRouterPermission]);

  const fetchBranches = async () => {
    try {
      const response = await axios.get('/api/branches');
       const data = response.data?.branches || [];
      setBranches(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, branchId: data[0].id }));
      }
    } catch (error) {
      setError(getErrorMessage(error));
      // Create a default branch if none exist
      setBranches([{ id: 1, name: 'Principal', location: 'Oficina Central', isActive: true, createdAt: '', updatedAt: '' }]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'branchId' ? parseInt(value) : value
    }));
  };

  const handleTestConnection = async () => {
    if (!formData.uri || !formData.username || !formData.password) {
      setError('Completa todos los campos de conexión antes de probar');
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
    
    if (!formData.name || !formData.uri || !formData.username || !formData.password) {
      setError('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.post('/api/routers', {
        name: formData.name,
        uri: formData.uri,
        username: formData.username,
        password: formData.password,
        branch_id: formData.branchId
      });
      setSuccess('Router creado exitosamente');
      setTimeout(() => {
        navigate('/dashboard/routers');
      }, 1500);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard/routers')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Agregar Router</h1>
          <p className="text-slate-600">Configura un nuevo router MikroTik</p>
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
            Completa los datos de conexión del router MikroTik
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
                  value={formData.name}
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
                  value={formData.branchId}
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
                  value={formData.uri}
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
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="admin"
                  required
                />
              </div>

              {/* Contraseña */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Contraseña del router"
                  required
                />
              </div>
            </div>

            {/* Connection Test */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium">Probar Conexión</h3>
                  <p className="text-sm text-slate-600">
                    Verifica que los datos de conexión sean correctos antes de guardar
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
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/routers')}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Crear Router
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