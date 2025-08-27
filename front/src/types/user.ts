export interface UserData {
  id: number;
  username: string;
  name?: string;
  email: string;
  role: string;
  twoFactorEnabled: boolean;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  success: boolean;
  users: UserData[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
  };
}