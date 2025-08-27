import axios from 'axios';
import type { UsersResponse, UserData } from '../types/user';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

export const userService = {
  async getUsers(page = 1, perPage = 20): Promise<UsersResponse> {
    const response = await axios.get(`${API_BASE_URL}/api/users`, {
      params: { page, per_page: perPage }
    });
    return response.data;
  },

  async getUser(id: number): Promise<UserData> {
    const response = await axios.get(`${API_BASE_URL}/api/users/${id}`);
    return response.data;
  },

  async createUser(data: {
    username: string;
    email: string;
    password: string;
    role?: string;
    isActive?: boolean;
  }): Promise<{ id: number; message: string }> {
    const response = await axios.post(`${API_BASE_URL}/api/users`, data);
    return response.data;
  },

  async updateUser(id: number, data: Partial<UserData>): Promise<{ message: string }> {
    const response = await axios.put(`${API_BASE_URL}/api/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: number): Promise<{ message: string }> {
    const response = await axios.delete(`${API_BASE_URL}/api/users/${id}`);
    return response.data;
  }
};