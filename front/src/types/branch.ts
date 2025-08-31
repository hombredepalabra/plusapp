export interface BranchData {
  id: number;
  name: string;
  location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  routers_count?: number;
}

export interface BranchListResponse {
  success: boolean;
  branches: BranchData[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
  };
}

export interface BranchResponse extends BranchData {
  success: boolean;
  message?: string;
}

export interface BasicResponse {
  success: boolean;
  message?: string;
}

