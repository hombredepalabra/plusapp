import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Shield, User, Clock, CheckCircle, AlertCircle, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Overview: React.FC = () => {
  const { user } = useAuth();

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const securityScore = user?.twoFactorEnabled ? 95 : 65;
  const securityLevel = securityScore >= 90 ? 'Excelente' : securityScore >= 70 ? 'Bueno' : 'Mejorable';
  const securityColor = securityScore >= 90 ? 'text-green-600' : securityScore >= 70 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Panel de Control</h1>
        <p className="text-slate-600">Resumen de tu cuenta y configuración de seguridad</p>
      </div>

      {/* Security Status Alert */}
      {!user?.twoFactorEnabled && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Mejora tu seguridad habilitando la autenticación de dos factores
                </p>
              </div>
              <Button asChild size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                <Link to="/dashboard/security">
                  Configurar 2FA
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-glow-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado de Cuenta</CardTitle>
            <User className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Activa</div>
            <p className="text-xs text-slate-600">
              Desde {formatDate(user?.createdAt)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-glow-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Autenticación 2FA</CardTitle>
            <Shield className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`text-2xl font-bold ${user?.twoFactorEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {user?.twoFactorEnabled ? 'Habilitada' : 'Deshabilitada'}
              </div>
              {user?.twoFactorEnabled ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-glow-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Acceso</CardTitle>
            <Clock className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Hoy</div>
            <p className="text-xs text-slate-600">
              {formatDate(user?.lastLogin)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-glow-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nivel de Seguridad</CardTitle>
            <Activity className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${securityColor}`}>
              {securityScore}%
            </div>
            <p className="text-xs text-slate-600">
              {securityLevel}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Información del Perfil</span>
            </CardTitle>
            <CardDescription>
              Detalles de tu cuenta y configuración personal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-600">Nombre:</span>
                <span className="text-sm text-slate-900">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-600">Email:</span>
                <span className="text-sm text-slate-900">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-600">ID de Usuario:</span>
                <span className="text-sm text-slate-500 font-mono">{user?.id}</span>
              </div>
            </div>
            <div className="pt-2">
              <Button asChild variant="outline" className="w-full">
                <Link to="/dashboard/profile">
                  Editar Perfil
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Configuración de Seguridad</span>
            </CardTitle>
            <CardDescription>
              Gestiona la seguridad de tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Autenticación de Dos Factores</span>
                <Badge variant={user?.twoFactorEnabled ? "default" : "secondary"}>
                  {user?.twoFactorEnabled ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Contraseña</span>
                <Badge variant="outline">
                  Configurada
                </Badge>
              </div>
            </div>
            <div className="pt-2 space-y-2">
              <Button asChild variant="outline" className="w-full">
                <Link to="/dashboard/security">
                  Configurar Seguridad
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card className="shadow-glow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Actividad Reciente</span>
          </CardTitle>
          <CardDescription>
            Historial de acciones en tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Sesión iniciada exitosamente</p>
                <p className="text-xs text-slate-600">Hoy</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Perfil actualizado</p>
                <p className="text-xs text-slate-600">Hace 2 días</p>
              </div>
            </div>
            {user?.twoFactorEnabled && (
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">2FA habilitado</p>
                  <p className="text-xs text-slate-600">Hace 1 semana</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};