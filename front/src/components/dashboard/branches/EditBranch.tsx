import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Alert, AlertDescription } from '../../ui/alert';
import { AlertTriangle } from 'lucide-react';
import { branchService } from '../../../services/branchService';
import type { BranchResponse } from '../../../types/branch';

export const EditBranch: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    is_active: true,
  });

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        const response: BranchResponse = await branchService.getBranch(Number(id));
        setFormData({
          name: response.name,
          location: response.location || '',
          is_active: response.is_active,
        });
      } catch (err: any) {
        const message = err.response?.data?.error || 'Error al cargar la sucursal';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchBranch();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await branchService.updateBranch(Number(id), {
        name: formData.name,
        location: formData.location || undefined,
        is_active: formData.is_active,
      });
      navigate('/dashboard/branches');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al actualizar la sucursal';
      setError(message);
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="outline">
        <Link to="/dashboard/branches">Volver</Link>
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Editar Sucursal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Nombre
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="location" className="block text-sm font-medium text-slate-700">
                Ubicación
              </Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              <Label htmlFor="is_active" className="text-sm text-slate-700">
                Activa
              </Label>
            </div>
            <Button type="submit">Guardar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditBranch;

