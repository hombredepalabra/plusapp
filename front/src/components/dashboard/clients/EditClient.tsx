import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Alert, AlertDescription } from '../../ui/alert';
import { ArrowLeft, Save, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { usePermissions } from '../../../hooks/usePermissions';
import axios from 'axios';

interface Router {
  id: string;
  name: string;
  uri: string;
  isActive: boolean;
}

interface PPPoEClient {
  id: string;
  name: string;
  password: string;
  comment?: string;
  profile?: string;
  contract?: string;
  routerId: string;
  router?: {
    id: string;
    name: string;
  };
  isActive: boolean;
}

interface EditClientForm {
  name: string;
  password: string;
  comment: string;
  profile: string;
  contract: string;
  routerId: string;
}

export const EditClient: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canManageClients } = usePermissions();
  
  const [client, setClient] = useState<PPPoEClient | null>(null);
  const [formData, setFormData] = useState<EditClientForm>({
    name: '',
    password: '',
    comment: '',
    profile: '',
    contract: '',
    routerId: ''
  });
  
  const [routers, setRouters] = useState<Router[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!canManageClients()) {
      navigate('/dashboard/clients');
    }
  }, [canManageClients, navigate]);

  useEffect(() => {
    if (id) {
      fetchClientDetails();
      fetchRouters();
    }
  }, [id]);

  const fetchClientDetails = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/pppoe/clients/${id}`);
      const clientData = response.data;
      
      setClient(clientData);
      setFormData({
        name: clientData.name || '',
        password: clientData.password || '',
        comment: clientData.comment || '',
        profile: clientData.profile || '',
        contract: clientData.contract || '',
        routerId: clientData.routerId || ''
      });
    } catch (err: any) {
      setError('Error al cargar cliente');
    }
  };

  const fetchRouters = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/routers`);
      setRouters(response.data.filter((router: Router) => router.isActive));
    } catch (err: any) {
      setError('Error al cargar routers');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return false;
    }

    if (!formData.password.trim()) {
      setError('La contraseña es requerida');
      return false;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (!formData.routerId) {
      setError('Debe seleccionar un router');
      return false;
    }

    return true;
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({
      ...prev,
      password
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const clientData = {
        name: formData.name.trim(),
        password: formData.password.trim(),
        comment: formData.comment.trim() || undefined,
        profile: formData.profile.trim() || undefined,
        contract: formData.contract.trim() || undefined,
        routerId: formData.routerId
      };

      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/pppoe/clients/${id}`, clientData);
      
      setSuccess(true);
      setTimeout(() => {
        navigate(`/dashboard/clients/${id}`);
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar cliente');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
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
          <div className="h-96 bg-slate-200 rounded"></div>
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
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate(`/dashboard/clients/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="flex items-center space-x-3">
          <User className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Editar Cliente</h1>
            <p className="text-slate-600">Modificar información de {client.name}</p>
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Cliente actualizado exitosamente. Redirigiendo...
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
          <CardDescription>
            Modifique los datos del cliente PPPoE
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cliente Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de Usuario *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ingrese el nombre de usuario"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generateRandomPassword}
                    className="text-xs"
                  >
                    Generar
                  </Button>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="text"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Contraseña (mín. 6 caracteres)"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile">Perfil</Label>
                <Input
                  id="profile"
                  name="profile"
                  value={formData.profile}
                  onChange={handleInputChange}
                  placeholder="Ej: 10M, 20M, 50M"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract">Contrato</Label>
                <Input
                  id="contract"
                  name="contract"
                  value={formData.contract}
                  onChange={handleInputChange}
                  placeholder="Número de contrato"
                />
              </div>
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
                    {router.name} ({router.uri})
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
                placeholder="Comentario adicional (opcional)"
              />
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4 pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
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
              
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/dashboard/clients/${id}`)}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};