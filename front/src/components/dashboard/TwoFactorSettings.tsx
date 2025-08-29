import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { 
  Shield, 
  Smartphone, 
  Key, 
  Download, 
  Copy, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  QrCode,
  Eye,
  EyeOff
} from 'lucide-react';
import type { TwoFactorSetup } from '../../types/auth';

export const TwoFactorSettings: React.FC = () => {
  const { user, enableTwoFactor, disableTwoFactor, isLoading } = useAuth();
  
  // Estados para configuración 2FA
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  // Iniciar configuración 2FA
  const handleStartSetup = async (): Promise<void> => {
    setLocalLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/auth/setup-2fa`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setSetupData(data);
      
      // Generar QR code
      const qrUrl = await QRCode.toDataURL(data.qrCodeUrl);
      setQrCodeUrl(qrUrl);
      
      setShowSetupDialog(true);
      toast.success('Configuración 2FA iniciada');
    } catch (err: any) {
      toast.error(`Error al iniciar configuración: ${err.message}`);
    } finally {
      setLocalLoading(false);
    }
  };

  // Habilitar 2FA
  const handleEnable2FA = async (): Promise<void> => {
    if (totpCode.length !== 6) {
      toast.error('Por favor ingresa un código de 6 dígitos');
      return;
    }

    try {
      const response = await enableTwoFactor(totpCode);
      if (response.success) {
        setRecoveryCodes(response.recoveryCodes);
        setShowRecoveryCodes(true);
        setTotpCode('');
        toast.success('2FA habilitado exitosamente');
      }
    } catch (err: any) {
      toast.error(`Error al habilitar 2FA: ${err.message}`);
      setTotpCode('');
    }
  };

  // Deshabilitar 2FA
  const handleDisable2FA = async (): Promise<void> => {
    if (disableCode.length !== 6) {
      toast.error('Por favor ingresa un código de 6 dígitos');
      return;
    }

    try {
      const response = await disableTwoFactor(disableCode);
      if (response.success) {
        setShowDisableDialog(false);
        setDisableCode('');
        toast.success('2FA deshabilitado exitosamente');
      }
    } catch (err: any) {
      toast.error(`Error al deshabilitar 2FA: ${err.message}`);
      setDisableCode('');
    }
  };

  // Copiar al portapapeles
  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copiado al portapapeles');
    } catch (err) {
      toast.error('Error al copiar');
    }
  };

  // Descargar códigos de recuperación
  const downloadRecoveryCodes = (): void => {
    const content = `Códigos de Recuperación 2FA\n\nGuarda estos códigos en un lugar seguro. Cada código solo puede usarse una vez.\n\n${recoveryCodes.join('\n')}\n\nGenerado: ${new Date().toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recovery-codes-2fa.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Códigos descargados');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Configuración de Seguridad</h1>
        <p className="text-slate-600">Gestiona la autenticación de dos factores y la seguridad de tu cuenta</p>
      </div>

      {/* Current Status */}
      <Card className="shadow-glow">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Estado de Autenticación 2FA</span>
            </div>
            <Badge variant={user?.twoFactorEnabled ? "default" : "secondary"} className="text-sm">
              {user?.twoFactorEnabled ? 'Habilitada' : 'Deshabilitada'}
            </Badge>
          </CardTitle>
          <CardDescription>
            La autenticación de dos factores añade una capa extra de seguridad a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.twoFactorEnabled ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Tu cuenta está protegida con autenticación de dos factores.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Tu cuenta no tiene 2FA habilitado. Se recomienda activarlo para mayor seguridad.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex space-x-3">
            {!user?.twoFactorEnabled ? (
              <Button 
                onClick={handleStartSetup} 
                disabled={localLoading}
                className="bg-slate-900 hover:bg-slate-800"
              >
                {localLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Habilitar 2FA
                  </>
                )}
              </Button>
            ) : (
              <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Shield className="mr-2 h-4 w-4" />
                    Deshabilitar 2FA
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>¿Deshabilitar 2FA?</DialogTitle>
                    <DialogDescription>
                      Esto reducirá la seguridad de tu cuenta. Ingresa un código de tu aplicación de autenticación para confirmar.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={disableCode}
                        onChange={setDisableCode}
                        disabled={isLoading}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowDisableDialog(false)}
                        className="flex-1"
                        disabled={isLoading}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDisable2FA}
                        className="flex-1"
                        disabled={isLoading || disableCode.length !== 6}
                      >
                        {isLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Deshabilitar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Autenticación 2FA</DialogTitle>
            <DialogDescription>
              Sigue estos pasos para configurar la autenticación de dos factores
            </DialogDescription>
          </DialogHeader>
          
          {!showRecoveryCodes ? (
            <div className="space-y-6">
              {/* Paso 1: Escanear QR */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center space-x-2">
                  <QrCode className="h-4 w-4" />
                  <span>Paso 1: Escanea el código QR</span>
                </h4>
                <div className="flex justify-center">
                  {qrCodeUrl && (
                    <div className="qr-container">
                      <img src={qrCodeUrl} alt="QR Code 2FA" className="w-48 h-48" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-600 text-center">
                  Usa Google Authenticator, Authy, o similar para escanear este código
                </p>
              </div>

              <Separator />

              {/* Paso 2: Clave manual */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center space-x-2">
                  <Key className="h-4 w-4" />
                  <span>Paso 2: O ingresa manualmente</span>
                </h4>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-2 bg-slate-100 rounded text-sm font-mono">
                    {showSecret ? setupData?.manualEntryKey : '••••••••••••••••'}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(setupData?.manualEntryKey || '')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Paso 3: Verificar */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center space-x-2">
                  <Smartphone className="h-4 w-4" />
                  <span>Paso 3: Verifica el código</span>
                </h4>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={totpCode}
                    onChange={setTotpCode}
                    disabled={isLoading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-sm text-slate-600 text-center">
                  Ingresa el código de 6 dígitos de tu aplicación
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSetupDialog(false)}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleEnable2FA}
                  className="flex-1 bg-slate-900 hover:bg-slate-800"
                  disabled={isLoading || totpCode.length !== 6}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Habilitar 2FA
                </Button>
              </div>
            </div>
          ) : (
            /* Códigos de recuperación */
            <div className="space-y-4">
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>¡Importante!</strong> Guarda estos códigos de recuperación en un lugar seguro. Los necesitarás si pierdes acceso a tu dispositivo.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <h4 className="font-medium">Códigos de Recuperación</h4>
                <div className="grid grid-cols-2 gap-2">
                  {recoveryCodes.map((code, index) => (
                    <code key={index} className="p-2 bg-slate-100 rounded text-sm font-mono text-center">
                      {code}
                    </code>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={downloadRecoveryCodes}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar
                </Button>
                <Button
                  onClick={() => {
                    setShowSetupDialog(false);
                    setShowRecoveryCodes(false);
                  }}
                  className="flex-1 bg-slate-900 hover:bg-slate-800"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Completar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Security Recommendations */}
      <Card className="shadow-glow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Recomendaciones de Seguridad</span>
          </CardTitle>
          <CardDescription>
            Consejos para mantener tu cuenta segura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Usa una contraseña fuerte y única</p>
                <p className="text-sm text-slate-600">Combina letras, números y símbolos</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className={`h-5 w-5 mt-0.5 ${user?.twoFactorEnabled ? 'text-green-600' : 'text-slate-400'}`} />
              <div>
                <p className="font-medium text-sm">Habilita la autenticación de dos factores</p>
                <p className="text-sm text-slate-600">Protección adicional contra accesos no autorizados</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Mantén tu aplicación de autenticación segura</p>
                <p className="text-sm text-slate-600">Usa un PIN o biometría para proteger la app</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Guarda los códigos de recuperación</p>
                <p className="text-sm text-slate-600">En un lugar seguro y offline</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};