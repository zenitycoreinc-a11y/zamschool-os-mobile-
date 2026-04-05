// Cloudflare Gateway API Client for Expo/React Native
import AsyncStorage from '@react-native-async-storage/async-storage';

const GATEWAY_URL = process.env.EXPO_PUBLIC_GATEWAY_URL || 'https://api.zamschool.com';

class MobileApiClient {
  baseUrl = GATEWAY_URL;
  token: string | null = null;
  refreshToken: string | null = null;
  
  async init() {
    this.token = await AsyncStorage.getItem('access_token');
    this.refreshToken = await AsyncStorage.getItem('refresh_token');
  }
  
  async setTokens(access: string, refresh: string) {
    this.token = access;
    this.refreshToken = refresh;
    await AsyncStorage.setItem('access_token', access);
    await AsyncStorage.setItem('refresh_token', refresh);
  }
  
  async clearTokens() {
    this.token = null;
    this.refreshToken = null;
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_profile']);
  }
  
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };
    
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    if (this.refreshToken) headers['X-Refresh-Token'] = this.refreshToken;
    
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) return this.request(endpoint, options);
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return response.status === 204 ? null : response.json();
  }
  
  private async refreshAccessToken() {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'X-Refresh-Token': this.refreshToken! }
      });
      
      if (response.ok) {
        const data = await response.json();
        await this.setTokens(data.access_token, this.refreshToken!);
        return true;
      }
    } catch (e) { console.error('Token refresh failed:', e); }
    
    await this.clearTokens();
    return false;
  }
  
  // Auth
  auth = {
    login: (email: string, password: string) =>
      this.request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (data: any) =>
      this.request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => this.request('/api/auth/logout', { method: 'POST' }).then(() => this.clearTokens()),
    forgotPassword: (email: string) =>
      this.request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    verifyEmail: (token: string, email: string) =>
      this.request('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ token, email }) }),
    getProfile: () => this.request('/api/auth/me'),
    updateProfile: (data: any) =>
      this.request('/api/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  };
  
  // Queries
  query = {
    dashboard: (params?: URLSearchParams) =>
      this.request(`/api/query/dashboard?${params?.toString() || ''}`),
    students: (params?: URLSearchParams) =>
      this.request(`/api/query/students?${params?.toString() || ''}`),
    attendance: (params?: URLSearchParams) =>
      this.request(`/api/query/attendance?${params?.toString() || ''}`),
    results: (params?: URLSearchParams) =>
      this.request(`/api/query/results?${params?.toString() || ''}`),
    payments: (params?: URLSearchParams) =>
      this.request(`/api/query/payments?${params?.toString() || ''}`),
    announcements: (params?: URLSearchParams) =>
      this.request(`/api/query/announcements?${params?.toString() || ''}`),
    notifications: (params?: URLSearchParams) =>
      this.request(`/api/query/notifications?${params?.toString() || ''}`),
    timetable: (params?: URLSearchParams) =>
      this.request(`/api/query/timetable?${params?.toString() || ''}`),
  };
  
  // Mutations
  mutation = {
    markAttendance: (data: any) =>
      this.request('/api/mutation/attendance/mark', { method: 'POST', body: JSON.stringify(data) }),
    submitAssignment: (data: any) =>
      this.request('/api/mutation/assignments/submit', { method: 'POST', body: JSON.stringify(data) }),
    sendMessage: (data: any) =>
      this.request('/api/mutation/messages/send', { method: 'POST', body: JSON.stringify(data) }),
    markNotificationsRead: (ids: string[]) =>
      this.request('/api/mutation/notifications/read', { method: 'POST', body: JSON.stringify({ notificationIds: ids }) }),
    processPayment: (data: any) =>
      this.request('/api/mutation/payments/process', { method: 'POST', body: JSON.stringify(data) }),
  };
  
  // Files
  files = {
    upload: async (uri: string, path: string, type: string) => {
      const formData = new FormData();
      formData.append('file', { uri, name: uri.split('/').pop(), type } as any);
      
      const key = `${path}/${Date.now()}-${uri.split('/').pop()}`;
      const response = await fetch(`${this.baseUrl}/api/files/${key}`, {
        method: 'PUT',
        body: await fetch(uri).then(r => r.blob()),
        headers: {
          'Content-Type': type,
          ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
        }
      });
      
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    getUrl: (key: string) => `${this.baseUrl}/api/files/${key}`,
  };
  
  // Images with transforms
  images = {
    get: (key: string, opts?: { w?: number; h?: number; f?: string }) => {
      const params = new URLSearchParams();
      if (opts?.w) params.set('w', String(opts.w));
      if (opts?.h) params.set('h', String(opts.h));
      if (opts?.f) params.set('f', opts.f);
      return `${this.baseUrl}/api/images/${key}${params.toString() ? '?' + params.toString() : ''}`;
    },
  };
  
  health = () => this.request('/health');
}

export const mobileApi = new MobileApiClient();
export default MobileApiClient;
