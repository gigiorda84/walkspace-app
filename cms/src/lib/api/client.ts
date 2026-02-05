import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Don't handle 401 on login page - let the page handle it
      const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';

      if (!isLoginPage) {
        // Token expired, try to refresh
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });
            const { accessToken } = response.data;
            localStorage.setItem('auth_token', accessToken);

            // Retry the original request
            error.config.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient.request(error.config);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        } else {
          // No refresh token, redirect to login
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Analytics API
import type {
  AnalyticsOverview,
  DurationAnalytics,
  EngagementAnalytics,
  TourAnalyticsItem,
  SessionItem,
} from '@/types/api';

export type AnalyticsPeriod = '7d' | '30d' | '90d' | 'all';

export const analyticsApi = {
  getOverview: async (period: AnalyticsPeriod = '30d'): Promise<AnalyticsOverview> => {
    const response = await apiClient.get(`/admin/analytics/overview?period=${period}`);
    return response.data;
  },

  getDuration: async (period: AnalyticsPeriod = '30d'): Promise<DurationAnalytics> => {
    const response = await apiClient.get(`/admin/analytics/duration?period=${period}`);
    return response.data;
  },

  getEngagement: async (period: AnalyticsPeriod = '30d'): Promise<EngagementAnalytics> => {
    const response = await apiClient.get(`/admin/analytics/engagement?period=${period}`);
    return response.data;
  },

  getTours: async (period: AnalyticsPeriod = '30d'): Promise<TourAnalyticsItem[]> => {
    const response = await apiClient.get(`/admin/analytics/tours?period=${period}`);
    return response.data;
  },

  getSessions: async (period: AnalyticsPeriod = '30d'): Promise<SessionItem[]> => {
    const response = await apiClient.get(`/admin/analytics/sessions?period=${period}`);
    return response.data;
  },

  deleteAll: async (): Promise<{ deleted: number }> => {
    const response = await apiClient.delete('/admin/analytics');
    return response.data;
  },
};

// Feedback API
export interface FeedbackSubmission {
  id: string;
  email: string | null;
  name: string | null;
  feedback: string | null;
  subscribeToNewsletter: boolean;
  createdAt: string;
}

export interface FeedbackListResponse {
  data: FeedbackSubmission[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const feedbackApi = {
  getAll: async (page: number = 1, limit: number = 50): Promise<FeedbackListResponse> => {
    const response = await apiClient.get(`/feedback?page=${page}&limit=${limit}`);
    return response.data;
  },
};
