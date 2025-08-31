import axios from 'axios';
import type { BranchListResponse, BranchResponse, BasicResponse } from '../types/branch';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

export const branchService = {
  async getBranches(page = 1, perPage = 20): Promise<BranchListResponse> {
    const response = await axios.get(`${API_BASE_URL}/api/branches`, {
      params: { page, per_page: perPage }
    });
    return response.data;
  },

  async getBranch(id: number): Promise<BranchResponse> {
    const response = await axios.get(`${API_BASE_URL}/api/branches/${id}`);
    return response.data;
  },

  async createBranch(data: { name: string; location?: string; is_active?: boolean }): Promise<BranchResponse> {
    const response = await axios.post(`${API_BASE_URL}/api/branches`, data);
    return response.data;
  },

  async updateBranch(id: number, data: { name?: string; location?: string; is_active?: boolean }): Promise<BranchResponse> {
    const response = await axios.put(`${API_BASE_URL}/api/branches/${id}`, data);
    return response.data;
  },

  async deleteBranch(id: number): Promise<BasicResponse> {
    const response = await axios.delete(`${API_BASE_URL}/api/branches/${id}`);
    return response.data;
  }
};

export default branchService;

