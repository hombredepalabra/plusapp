/**
 * DOCUMENTACIÓN PARA EL BACKEND
 * ============================
 * 
 * Este archivo define todos los tipos TypeScript que el frontend espera.
 * El backend debe implementar endpoints que retornen exactamente estos formatos.
 * 
 * ENDPOINTS REQUERIDOS:
 * 
 * POST /api/auth/login
 * Body: { email: string, password: string }
 * Response: LoginResponse
 * 
 * POST /api/auth/verify-2fa
 * Body: { token: string, totpCode: string }
 * Response: AuthResponse
 * 
 * POST /api/auth/setup-2fa
 * Headers: { Authorization: "Bearer <token>" }
 * Response: TwoFactorSetup
 * 
 * POST /api/auth/enable-2fa
 * Headers: { Authorization: "Bearer <token>" }
 * Body: { totpCode: string }
 * Response: { success: boolean, recoveryCodes: string[] }
 * 
 * POST /api/auth/disable-2fa
 * Headers: { Authorization: "Bearer <token>" }
 * Body: { totpCode: string }
 * Response: { success: boolean }
 * 
 * POST /api/auth/forgot-password
 * Body: { email: string }
 * Response: { success: boolean, message: string }
 * 
 * POST /api/auth/reset-password
 * Body: { token: string, newPassword: string }
 * Response: { success: boolean, message: string }
 * 
 * POST /api/auth/change-password
 * Headers: { Authorization: "Bearer <token>" }
 * Body: { currentPassword: string, newPassword: string }
 * Response: { success: boolean, message: string }
 * 
 * GET /api/users/profile
 * Headers: { Authorization: "Bearer <token>" }
 * Response: User
 */

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  twoFactorEnabled: boolean;
  role: string;
  permissions?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface LoginResponse {
  success: boolean;
  requiresTwoFactor: boolean;
  token?: string; // Solo si no requiere 2FA
  tempToken?: string; // Para proceso de 2FA
  user?: User;
  message?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
  backupCodes: string[];
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<LoginResponse>;
  verifyTwoFactor: (tempToken: string, totpCode: string) => Promise<AuthResponse>;
  logout: () => void;
  setupTwoFactor: () => Promise<TwoFactorSetup>;
  enableTwoFactor: (totpCode: string) => Promise<{ success: boolean; recoveryCodes: string[] }>;
  disableTwoFactor: (totpCode: string) => Promise<{ success: boolean }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  isLoading: boolean;
  error: string | null;
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}
