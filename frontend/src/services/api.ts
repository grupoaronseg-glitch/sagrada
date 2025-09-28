import axios from 'axios';

const API_BASE_URL = import.meta.env.REACT_APP_BACKEND_URL || 'https://webclicker.preview.emergentagent.com';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Site {
  id: string;
  name: string;
  url: string;
  duration: number;
  interval: number;
  is_active: boolean;
  clicks: number;
  last_access?: string;
  created_at: string;
  updated_at: string;
}

export interface SiteCreate {
  name: string;
  url: string;
  duration: number;
  interval: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  action: string;
  site_name?: string;
  message: string;
  duration?: number;
}

export interface SystemStatus {
  is_running: boolean;
  is_paused: boolean;
  global_interval: number;
  active_sites_count: number;
  total_sites_count: number;
  total_clicks: number;
  system_status: string;
}

// Sites API
export const sitesAPI = {
  getAll: () => api.get<Site[]>('/sites'),
  getById: (id: string) => api.get<Site>(`/sites/${id}`),
  create: (data: SiteCreate) => api.post<Site>('/sites', data),
  update: (id: string, data: Partial<SiteCreate>) => api.put<Site>(`/sites/${id}`, data),
  delete: (id: string) => api.delete(`/sites/${id}`),
  toggle: (id: string) => api.post<{message: string, is_active: boolean}>(`/sites/${id}/toggle`),
  export: () => api.get('/sites/export'),
  import: (data: { sites: SiteCreate[], replace_existing?: boolean }) => api.post('/sites/import', data),
};

// Control API
export const controlAPI = {
  start: () => api.post<{message: string, status: string}>('/control/start'),
  pause: () => api.post<{message: string, status: string}>('/control/pause'),
  stop: () => api.post<{message: string, status: string}>('/control/stop'),
  getStatus: () => api.get<SystemStatus>('/status'),
};

// Logs API
export const logsAPI = {
  getAll: (params: { 
    level?: string, 
    site_name?: string, 
    search?: string, 
    limit?: number, 
    offset?: number 
  } = {}) => api.get<LogEntry[]>('/logs', { params }),
  clear: () => api.delete('/logs'),
  export: (format: 'txt' | 'csv' | 'json', params: Record<string, any> = {}) => {
    return api.get('/logs/export', {
      params: { format, ...params },
      responseType: 'blob',
    });
  },
};

// Settings API
export const settingsAPI = {
  getAll: () => api.get<Record<string, string>>('/settings'),
  update: (key: string, value: string) => api.put(`/settings/${key}`, { value }),
};

// WebSocket connection class
export class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Array<(data: any) => void>>();
  public isConnected = false;
  private reconnectDelay = 1000;
  private maxReconnectAttempts = 5;
  private reconnectAttempts = 0;

  connect(clientId?: string) {
    const wsUrl = API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    const url = clientId ? `${wsUrl}/ws?client_id=${clientId}` : `${wsUrl}/ws`;
    
    try {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.type, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.emit('disconnected');
        this.handleReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.log('Max reconnection attempts reached');
    }
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any = null) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket listener:', error);
        }
      });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

export default api;