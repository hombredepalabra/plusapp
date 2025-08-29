import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import type { 
  User, 
  AuthContextType, 
  LoginResponse, 
  AuthResponse, 
  TwoFactorSetup 
} from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Instancia de axios para todas las peticiones del frontend
const api = axios.create({
  baseURL: API_BASE_URL,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configurar token en headers
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      setToken(savedToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      // Obtener perfil del usuario
      fetchUserProfile().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async (): Promise<void> => {
    try {
      const response = await api.get('/api/users/profile');
      const userData = response.data;
      console.log('User profile data:', userData);
      const user: User = {
        id: userData.id.toString(),
        username: userData.username,
        email: userData.email,
        name: userData.username,
        twoFactorEnabled: userData.two_factor_enabled,
        role: userData.role,
        isActive: userData.is_active,
        createdAt: userData.created_at,
        lastLogin: userData.last_login
      };
      setUser(user);
    } catch (err) {
      console.error('Error al cargar perfil:', err);
      logout();
    }
  };

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const data: LoginResponse = response.data;
      
      if (data.success && !data.requiresTwoFactor && data.token && data.user) {
        const userData = data.user;
        console.log('User data on login:', userData);
        const user: User = {
          id: userData.id.toString(),
          username: userData.username || userData.name,
          email: userData.email,
          name: userData.name,
          twoFactorEnabled: userData.twoFactorEnabled,
          role: userData.role,
          isActive: userData.isActive || true,
          createdAt: userData.createdAt,
          lastLogin: userData.lastLogin
        };
        setToken(data.token);
        setUser(user);
        localStorage.setItem('authToken', data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      }
      
      return data;
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al iniciar sesión';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTwoFactor = async (tempToken: string, totpCode: string): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/auth/verify-2fa', { token: tempToken, totpCode });
      const data: AuthResponse = response.data;
      
      if (data.success) {
        const userData = data.user;
        console.log('User data on 2FA verification:', userData);
        const user: User = {
          id: userData.id.toString(),
          username: userData.username || userData.name,
          email: userData.email,
          name: userData.name,
          twoFactorEnabled: userData.twoFactorEnabled,
          role: userData.role,
          isActive: userData.isActive,
          createdAt: userData.createdAt,
          lastLogin: userData.lastLogin
        };
        setToken(data.token);
        setUser(user);
        localStorage.setItem('authToken', data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      }
      
      return data;
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Código 2FA inválido';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('authToken');
    delete api.defaults.headers.common['Authorization'];
  };

  const setupTwoFactor = async (): Promise<TwoFactorSetup> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/auth/setup-2fa');
      return response.data;
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al configurar 2FA';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const enableTwoFactor = async (totpCode: string): Promise<{ success: boolean; recoveryCodes: string[] }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/auth/enable-2fa', { totpCode });
      if (response.data.success) {
        // Actualizar usuario
        setUser(prev => prev ? { ...prev, twoFactorEnabled: true } : null);
      }
      return response.data;
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al habilitar 2FA';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const disableTwoFactor = async (totpCode: string): Promise<{ success: boolean }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/auth/disable-2fa', { totpCode });
      if (response.data.success) {
        setUser(prev => prev ? { ...prev, twoFactorEnabled: false } : null);
      }
      return response.data;
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al deshabilitar 2FA';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al enviar email de recuperación';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/auth/reset-password', { token, newPassword });
      return response.data;
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al restablecer contraseña';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/auth/change-password', { currentPassword, newPassword });
      return response.data;
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al cambiar contraseña';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    verifyTwoFactor,
    logout,
    setupTwoFactor,
    enableTwoFactor,
    disableTwoFactor,
    forgotPassword,
    resetPassword,
    changePassword,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};