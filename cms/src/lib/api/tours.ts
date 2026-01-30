import { apiClient } from './client';
import { Tour, TourVersion, TourPoint, ApiResponse, PaginatedResponse } from '@/types/api';

// Tours API endpoints
export const toursApi = {
  // Get all tours
  async getAllTours(): Promise<Tour[]> {
    const response = await apiClient.get<Tour[]>('/admin/tours');
    return response.data;
  },

  // Get single tour
  async getTour(id: string): Promise<Tour> {
    const response = await apiClient.get<Tour>(`/admin/tours/${id}`);
    return response.data;
  },

  // Create tour
  async createTour(data: Partial<Tour>): Promise<Tour> {
    const response = await apiClient.post<Tour>('/admin/tours', data);
    return response.data;
  },

  // Update tour
  async updateTour(id: string, data: Partial<Tour>): Promise<Tour> {
    const response = await apiClient.patch<Tour>(`/admin/tours/${id}`, data);
    return response.data;
  },

  // Delete tour
  async deleteTour(id: string): Promise<void> {
    await apiClient.delete(`/admin/tours/${id}`);
  },

  // Get tour versions
  async getTourVersions(tourId: string): Promise<TourVersion[]> {
    const response = await apiClient.get<TourVersion[]>(`/admin/tours/${tourId}/versions`);
    return response.data;
  },

  // Get tour points
  async getTourPoints(tourId: string): Promise<TourPoint[]> {
    const response = await apiClient.get<TourPoint[]>(`/admin/tours/${tourId}/points`);
    return response.data;
  },
};
