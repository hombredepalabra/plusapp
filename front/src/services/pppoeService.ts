import axios from 'axios';
import type { PPPoEClientsResponse, PPPoEClient, CreateClientData } from '../types/pppoe';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

export const pppoeService = {
  async getClients(page = 1, perPage = 50, sync = false): Promise<PPPoEClientsResponse> {
    const response = await axios.get(`${API_BASE_URL}/api/pppoe/clients`, {
      params: { page, per_page: perPage, sync }
    });
    return response.data;
  },

  async getClient(id: number): Promise<PPPoEClient> {
    const response = await axios.get(`${API_BASE_URL}/api/pppoe/clients/${id}`);
    return response.data;
  },

  async searchClients(query: string): Promise<PPPoEClient[]> {
    const response = await axios.get(`${API_BASE_URL}/api/pppoe/clients/search`, {
      params: { q: query }
    });
    return response.data;
  },

  async createClient(data: CreateClientData): Promise<PPPoEClient> {
    const response = await axios.post(`${API_BASE_URL}/api/pppoe/clients`, data);
    return response.data;
  },

  async updateClient(id: number, data: Partial<CreateClientData>): Promise<PPPoEClient> {
    const response = await axios.put(`${API_BASE_URL}/api/pppoe/clients/${id}`, data);
    return response.data;
  },

  async deleteClient(id: number): Promise<{ message: string }> {
    const response = await axios.delete(`${API_BASE_URL}/api/pppoe/clients/${id}`);
    return response.data;
  },

  async getActiveSessions() {
    const response = await axios.get(`${API_BASE_URL}/api/pppoe/sessions/active`);
    return response.data;
  }
};
