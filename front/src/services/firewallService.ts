import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

export const firewallService = {
  async getRules() {
    const response = await axios.get(`${API_BASE_URL}/api/firewall/rules`);
    return response.data.rules || [];
  },

  async blockIP(data: { ipAddress: string; comment?: string; routerId: string }) {
    const response = await axios.post(`${API_BASE_URL}/api/firewall/block-ip`, data);
    return response.data;
  },

  async unblockIP(ipAddress: string) {
    const response = await axios.delete(`${API_BASE_URL}/api/firewall/unblock-ip`, {
      data: { ipAddress }
    });
    return response.data;
  }
};
