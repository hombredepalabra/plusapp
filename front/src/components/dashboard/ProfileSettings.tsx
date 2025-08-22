import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { toast } from 'sonner';
import { Loader2, User, Lock, Mail, CheckCircle } from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const { user, changePassword, isLoading } = useAuth();
  
  // Estados para cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Por favor complete todos los campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las nuevas contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    try {
      const response = await changePassword(currentPassword, newPassword);
      if (response.success) {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast.success('Contraseña actualizada exitosamente');
      }
    } catch (err: any) {
      setPasswordError(err.message);
      toast.error('Error al cambiar la contraseña');
    }
  };

  const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    if (password.length === 0) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.match(/[a-z]/)) score += 25;
    if (password.match(/[A-Z]/)) score += 25;
    if (password.match(/[0-9]/)) score += 12.5;
    if (password.match(/[^a-zA-Z0-9]/)) score += 12.5;

    if (score < 50) return { score, label: 'Débil', color: 'bg-red-500' };
    if (score < 75) return { score, label: 'Regular', color: 'bg-yellow-500' };
    if (score < 100) return { score, label: 'Fuerte', color: 'bg-blue-500' };
    return { score, label: 'Muy Fuerte', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Configuración del Perfil</h1>
        <p className="text-slate-600">Gestiona tu información personal y contraseña</p>
      </div>

      {/* Profile Information */}
      <Card className="shadow-glow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Información Personal</span>
          </CardTitle>
          <CardDescription>
            Tu información básica de la cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              <div className="flex items-center space-x-2">
                <Input 
                  value={user?.name || ''} 
                  disabled 
                  className="bg-slate-50" 
                />
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Correo Electrónico</Label>
              <div className="flex items-center space-x-2">
                <Input 
                  value={user?.email || ''} 
                  disabled 
                  className="bg-slate-50" 
                />
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>ID de Usuario</Label>
            <Input 
              value={user?.id || ''} 
              disabled 
              className="bg-slate-50 font-mono text-sm" 
            />
          </div>
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Para cambiar tu información personal, contacta al administrador del sistema.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Separator />

      {/* Password Change */}
      <Card className="shadow-glow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>Cambiar Contraseña</span>
          </CardTitle>
          <CardDescription>
            Actualiza tu contraseña para mantener tu cuenta segura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordError && (
              <Alert variant="destructive">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            
            {passwordSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Tu contraseña ha sido actualizada exitosamente.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Contraseña actual"
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nueva contraseña"
                  className="pl-10"
                  disabled={isLoading}
                  required
                  minLength={8}
                />
              </div>
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Fortaleza de la contraseña:</span>
                    <span className={`font-medium ${
                      passwordStrength.score < 50 ? 'text-red-600' :
                      passwordStrength.score < 75 ? 'text-yellow-600' :
                      passwordStrength.score < 100 ? 'text-blue-600' :
                      'text-green-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.score}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar nueva contraseña"
                  className="pl-10"
                  disabled={isLoading}
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-medium text-slate-900 mb-2">Requisitos de contraseña:</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                  <span>Al menos 8 caracteres</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${newPassword.match(/[a-z]/) ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                  <span>Una letra minúscula</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${newPassword.match(/[A-Z]/) ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                  <span>Una letra mayúscula</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${newPassword.match(/[0-9]/) ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                  <span>Un número</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${newPassword.match(/[^a-zA-Z0-9]/) ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                  <span>Un carácter especial</span>
                </li>
              </ul>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 transition-all duration-200"
              disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando contraseña...
                </>
              ) : (
                'Actualizar Contraseña'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};