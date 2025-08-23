import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

export interface RouterInfo {
  id: string;
  name: string;
  isActive: boolean;
}

export const routerService = {
  async getRouters(): Promise<RouterInfo[]> {
    const response = await axios.get<RouterInfo[]>(`${API_BASE_URL}/api/routers`);
    return response.data;
  }
};

export default routerService;
