import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp';
import { Loader2, Shield, ArrowLeft } from 'lucide-react';

export const TwoFactorVerification: React.FC = () => {
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const { verifyTwoFactor, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const tempToken = location.state?.tempToken;

  useEffect(() => {
    if (!tempToken) {
      navigate('/login');
    }
  }, [tempToken, navigate]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');

    if (totpCode.length !== 6) {
      setError('Por favor ingresa un código de 6 dígitos');
      return;
    }

    try {
      const response = await verifyTwoFactor(tempToken, totpCode);
      if (response.success) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
      setTotpCode('');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Verificación 2FA</CardTitle>
          <CardDescription>
            Ingresa el código de 6 dígitos de tu aplicación de autenticación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
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
            
            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 transition-all duration-200"
                disabled={isLoading || totpCode.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar Código'
                )}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/login')}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};