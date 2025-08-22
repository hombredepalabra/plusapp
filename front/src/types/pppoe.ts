export interface PPPoEClient {
  id: number;
  name: string;
  ip: string;
  profile: string;
  comment: string;
  contract: string;
  router_id: number;
  is_active: boolean;
  created_at: string | null;
}

export interface PPPoEClientsResponse {
  clients: PPPoEClient[];
  total: number;
  pages: number;
  current_page: number;
}

export interface Router {
  id: number;
  name: string;
  uri: string;
  username: string;
  branch_id: number;
  is_active: boolean;
}

export interface CreateClientData {
  router_id: number;
  name: string;
  password: string;
  ip: string;
  profile?: string;
  comment?: string;
  contract?: string;
  local_address?: string;
}