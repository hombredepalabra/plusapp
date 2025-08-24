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
