import { apiClient } from './client';
import { TourPointLocalization } from '@/types/api';

export const pointLocalizationsApi = {
  /**
   * Get all localizations for a specific point
   */
  async getLocalizationsByPoint(tourId: string, pointId: string): Promise<TourPointLocalization[]> {
    const response = await apiClient.get<TourPointLocalization[]>(
      `/admin/tours/${tourId}/points/${pointId}/localizations`
    );
    return response.data;
  },

  /**
   * Get a specific localization
   */
  async getLocalization(
    tourId: string,
    pointId: string,
    localizationId: string
  ): Promise<TourPointLocalization> {
    const response = await apiClient.get<TourPointLocalization>(
      `/admin/tours/${tourId}/points/${pointId}/localizations/${localizationId}`
    );
    return response.data;
  },

  /**
   * Create a new point localization
   */
  async createLocalization(
    tourId: string,
    pointId: string,
    data: {
      language: string;
      title: string;
      description: string;
      audioFileId?: string;
      imageFileId?: string;
      subtitleFileId?: string;
    }
  ): Promise<TourPointLocalization> {
    const response = await apiClient.post<TourPointLocalization>(
      `/admin/tours/${tourId}/points/${pointId}/localizations`,
      data
    );
    return response.data;
  },

  /**
   * Update a point localization
   */
  async updateLocalization(
    tourId: string,
    pointId: string,
    localizationId: string,
    data: {
      title?: string;
      description?: string;
      audioFileId?: string;
      imageFileId?: string;
      subtitleFileId?: string;
    }
  ): Promise<TourPointLocalization> {
    const response = await apiClient.patch<TourPointLocalization>(
      `/admin/tours/${tourId}/points/${pointId}/localizations/${localizationId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete a point localization
   */
  async deleteLocalization(
    tourId: string,
    pointId: string,
    localizationId: string
  ): Promise<void> {
    await apiClient.delete(
      `/admin/tours/${tourId}/points/${pointId}/localizations/${localizationId}`
    );
  },
};
