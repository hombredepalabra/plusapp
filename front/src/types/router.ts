/**
 * Tipos para el sistema de gestión de routers MikroTik
 */

export interface Branch {
  id: number;
  name: string;
  location?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Router {
  id: number;
  name: string;
  uri: string;
  username: string;
  password: string;
  branchId: number;
  branch?: Branch;
  isActive: boolean;
  status?: 'online' | 'offline' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface PPPoEClient {
  id: string;
  routerId: number;
  router?: Router;
  ip?: string;
  ipAddress?: string;
  name: string;
  password: string;
  comment?: string;
  profile?: string;
  profileValue?: string;
  contract?: string;
  isActive: boolean;
  status?: 'active' | 'suspended' | 'blocked' | 'disconnected';
  createdAt: string;
  updatedAt?: string;
}

export interface PPPoESession {
  id: string;
  clientId: string;
  client?: PPPoEClient;
  ip?: string;
  ipAddress?: string;
  uptime: string;
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  createdAt: string;
}

export interface RouterInterface {
  id: string;
  routerId: number;
  name: string;
  type: string;
  status: 'up' | 'down';
  macAddress?: string;
  mtu?: number;
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
}

export interface RouterResource {
  routerId: number;
  cpuLoad: number;
  memoryUsed: number;
  memoryTotal: number;
  diskUsed: number;
  diskTotal: number;
  uptime: string;
  temperature?: number;
  voltage?: number;
  timestamp: string;
}

export interface FirewallRule {
  id: string;
  routerId: number;
  router?: Router;
  firewallId: string;
  ipAddress: string;
  comment?: string;
  creationDate?: string;
  isActive: boolean;
  protocol?: string;
  port?: string;
  action?: string;
  chain?: string;
}

export interface DashboardStats {
  totalRouters: number;
  onlineRouters: number;
  totalClients: number;
  activeClients: number;
  suspendedClients: number;
  blockedClients: number;
  totalSessions: number;
  totalBandwidth: number;
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  routerId?: number;
  router?: Router;
  clientId?: string;
  client?: PPPoEClient;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  routerId: number;
  router?: Router;
  userId: number;
  user?: unknown;
  action: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface SyncLog {
  id: string;
  routerId: number;
  router?: Router;
  action: 'sync' | 'update' | 'delete';
  status: 'success' | 'error';
  message?: string;
  itemsProcessed: number;
  createdAt: string;
}

// Request/Response types
export interface CreateRouterRequest {
  name: string;
  uri: string;
  username: string;
  password: string;
  branchId: number;
}

export interface UpdateRouterRequest {
  name?: string;
  uri?: string;
  username?: string;
  password?: string;
  branchId?: number;
  isActive?: boolean;
}

export interface CreatePPPoEClientRequest {
  routerId: number;
  name: string;
  password: string;
  comment?: string;
  profile?: string;
  contract?: string;
}

export interface UpdatePPPoEClientRequest {
  name?: string;
  password?: string;
  comment?: string;
  profile?: string;
  contract?: string;
  isActive?: boolean;
}

export interface ClientStatusUpdate {
  status: 'active' | 'suspended' | 'blocked';
  reason?: string;
}

export interface BlockIPRequest {
  ipAddress: string;
  comment?: string;
}

export interface ClientBandwidthStats {
  clientId: string;
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  timestamp: string;
}

export interface ClientStats {
  clientId: string;
  totalSessions: number;
  totalUptime: string;
  avgBandwidthIn: number;
  avgBandwidthOut: number;
  lastConnection: string;
  totalBytes: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Search and Filter types
export interface RouterFilters {
  search?: string;
  branchId?: number;
  isActive?: boolean;
  status?: 'online' | 'offline' | 'error';
}

export interface PPPoEClientFilters {
  search?: string;
  routerId?: number;
  status?: 'active' | 'suspended' | 'blocked' | 'disconnected';
  profile?: string;
  isActive?: boolean;
}

export interface SessionFilters {
  routerId?: number;
  clientId?: string;
  ip?: string;
  ipAddress?: string;
}