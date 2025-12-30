import { apiClient } from './client';
import { TourPoint } from '@/types/api';

export const pointsApi = {
  /**
   * Get all points for a tour
   */
  async getPointsByTour(tourId: string): Promise<TourPoint[]> {
    const response = await apiClient.get<TourPoint[]>(`/admin/tours/${tourId}/points`);
    return response.data;
  },

  /**
   * Get a specific point
   */
  async getPoint(tourId: string, pointId: string): Promise<TourPoint> {
    const response = await apiClient.get<TourPoint>(`/admin/tours/${tourId}/points/${pointId}`);
    return response.data;
  },

  /**
   * Create a new tour point
   */
  async createPoint(tourId: string, data: {
    latitude: number;
    longitude: number;
    sequenceOrder: number;
    triggerRadiusMeters: number;
  }): Promise<TourPoint> {
    // Transform frontend field names to backend field names
    const backendData = {
      lat: data.latitude,
      lng: data.longitude,
      order: data.sequenceOrder,
      defaultTriggerRadiusMeters: data.triggerRadiusMeters,
    };
    const response = await apiClient.post<TourPoint>(`/admin/tours/${tourId}/points`, backendData);
    return response.data;
  },

  /**
   * Update a tour point
   */
  async updatePoint(tourId: string, pointId: string, data: Partial<{
    lat?: number;
    lng?: number;
    order?: number;
    defaultTriggerRadiusMeters?: number;
  }>): Promise<TourPoint> {
    const response = await apiClient.patch<TourPoint>(`/admin/tours/${tourId}/points/${pointId}`, data);
    return response.data;
  },

  /**
   * Delete a tour point
   */
  async deletePoint(tourId: string, pointId: string): Promise<void> {
    await apiClient.delete(`/admin/tours/${tourId}/points/${pointId}`);
  },

  /**
   * Reorder points
   */
  async reorderPoints(tourId: string, pointIds: string[]): Promise<TourPoint[]> {
    const response = await apiClient.post<TourPoint[]>(`/admin/tours/${tourId}/points/reorder`, {
      pointIds,
    });
    return response.data;
  },
};
