export interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
  two_factor_enabled: boolean;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsersResponse {
  users: UserData[];
  total: number;
  pages: number;
  current_page: number;
}