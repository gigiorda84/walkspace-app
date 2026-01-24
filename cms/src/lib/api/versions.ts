import { apiClient } from './client';
import { TourVersion } from '@/types/api';

// API functions for managing tour versions (v2 - added busInfo support)
export const versionsApi = {
  /**
   * Get all versions for a tour
   */
  async getVersionsByTour(tourId: string): Promise<TourVersion[]> {
    const response = await apiClient.get<TourVersion[]>(`/admin/tours/${tourId}/versions`);
    return response.data;
  },

  /**
   * Get a specific version
   */
  async getVersion(tourId: string, versionId: string): Promise<TourVersion> {
    const response = await apiClient.get<TourVersion>(`/admin/tours/${tourId}/versions/${versionId}`);
    return response.data;
  },

  /**
   * Create a new tour version
   */
  async createVersion(tourId: string, data: {
    language: string;
    title: string;
    description: string;
    completionMessage?: string;
    busInfo?: string;
    coverImageFileId?: string;
    coverTrailerFileId?: string;
    routePolyline?: string;
    status?: 'draft' | 'published';
  }): Promise<TourVersion> {
    const response = await apiClient.post<TourVersion>(`/admin/tours/${tourId}/versions`, data);
    return response.data;
  },

  /**
   * Update a tour version
   */
  async updateVersion(tourId: string, versionId: string, data: Partial<TourVersion>): Promise<TourVersion> {
    const response = await apiClient.patch<TourVersion>(`/admin/tours/${tourId}/versions/${versionId}`, data);
    return response.data;
  },

  /**
   * Delete a tour version
   */
  async deleteVersion(tourId: string, versionId: string): Promise<void> {
    await apiClient.delete(`/admin/tours/${tourId}/versions/${versionId}`);
  },

  /**
   * Publish a tour version
   */
  async publishVersion(tourId: string, versionId: string): Promise<TourVersion> {
    const response = await apiClient.post<TourVersion>(`/admin/tours/${tourId}/versions/${versionId}/publish`);
    return response.data;
  },

  /**
   * Unpublish a tour version
   */
  async unpublishVersion(tourId: string, versionId: string): Promise<TourVersion> {
    const response = await apiClient.post<TourVersion>(`/admin/tours/${tourId}/versions/${versionId}/unpublish`);
    return response.data;
  },
};
