import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Alert, AlertDescription } from '../../ui/alert';
import { ArrowLeft, UserPlus, AlertTriangle, Check, X } from 'lucide-react';
import { userService } from '../../../services/userService';
import { toast } from 'sonner';

export const CreateUser: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    is_active: true
  });

  const validatePassword = (password: string) => {
    const commonPasswords = [
      'password', 'admin', 'administrator', 'root', 'user', 'guest', 'test',
      '123456', '123456789', 'qwerty', 'abc123', 'password123', 'admin123',
      'letmein', 'welcome', 'monkey', 'dragon', 'master', 'superman'
    ];

    if (password.length < 12) return 'La contraseña debe tener al menos 12 caracteres';
    if (commonPasswords.includes(password.toLowerCase())) return 'La contraseña es muy común, elige una más segura';
    if (/(.)\1{3,}/.test(password)) return 'La contraseña no puede tener 4 o más caracteres repetidos';
    if (/(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def)/.test(password.toLowerCase())) return 'La contraseña no puede contener secuencias obvias';
    if (/^[a-zA-Z]+\d+$/.test(password) && password.length <= 15) return 'La contraseña no puede ser solo nombre + números';
    if (!/[A-Z]/.test(password)) return 'La contraseña debe tener al menos una mayúscula';
    if (!/[a-z]/.test(password)) return 'La contraseña debe tener al menos una minúscula';
    if (!/\d/.test(password)) return 'La contraseña debe tener al menos un número';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'La contraseña debe tener al menos un símbolo';
    return null;
  };

  const getPasswordRequirements = (password: string) => {
    const commonPasswords = [
      'password', 'admin', 'administrator', 'root', 'user', 'guest', 'test',
      '123456', '123456789', 'qwerty', 'abc123', 'password123', 'admin123',
      'letmein', 'welcome', 'monkey', 'dragon', 'master', 'superman'
    ];

    return [
      { text: 'Mínimo 12 caracteres', valid: password.length >= 12 },
      { text: 'Al menos una mayúscula (A-Z)', valid: /[A-Z]/.test(password) },
      { text: 'Al menos una minúscula (a-z)', valid: /[a-z]/.test(password) },
      { text: 'Al menos un número (0-9)', valid: /\d/.test(password) },
      { text: 'Al menos un símbolo (!@#$%^&*)', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
      { text: 'No usar contraseñas comunes', valid: !commonPasswords.includes(password.toLowerCase()) },
      { text: 'Evitar secuencias obvias', valid: !/(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def)/.test(password.toLowerCase()) }
    ];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      setLoading(true);
      await userService.createUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        is_active: formData.is_active
      });
      
      toast.success('Usuario creado exitosamente');
      navigate('/dashboard/users');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al crear usuario';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const requirements = getPasswordRequirements(formData.password);
  const showRequirements = formData.password.length > 0 && requirements.some(req => !req.valid);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/dashboard/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Crear Nuevo Usuario</h1>
          <p className="text-slate-600">Completa la información para crear un nuevo usuario</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Información del Usuario</span>
          </CardTitle>
          <CardDescription>
            Ingresa los datos del nuevo usuario del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nombre de Usuario</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  placeholder="Ingresa el nombre de usuario"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Contraseña segura"
                />
                {showRequirements && (
                  <div className="text-xs text-slate-600 mt-2 p-3 bg-slate-50 rounded-md border">
                    <p className="font-medium mb-2">Requisitos de contraseña:</p>
                    <ul className="space-y-1">
                      {requirements.map((req, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          {req.valid ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <X className="h-3 w-3 text-red-500" />
                          )}
                          <span className={req.valid ? 'text-green-700' : 'text-slate-600'}>
                            {req.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="Repite la contraseña"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="user">Usuario</option>
                  <option value="operator">Operador</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_active">Estado</Label>
                <select
                  id="is_active"
                  name="is_active"
                  value={formData.is_active.toString()}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/users')}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};