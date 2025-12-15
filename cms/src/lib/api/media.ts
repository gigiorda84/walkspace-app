import { apiClient } from './client';
import { MediaFile } from '@/types/api';

export const mediaApi = {
  /**
   * Get all media files with optional filters
   */
  async getAllMedia(filters?: {
    type?: 'audio' | 'image' | 'subtitle';
    search?: string;
  }): Promise<MediaFile[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.search) params.append('search', filters.search);

    const response = await apiClient.get<MediaFile[]>(`/admin/media?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a specific media file
   */
  async getMedia(id: string): Promise<MediaFile> {
    const response = await apiClient.get<MediaFile>(`/admin/media/${id}`);
    return response.data;
  },

  /**
   * Upload a new media file
   */
  async uploadMedia(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<MediaFile> {
    const formData = new FormData();
    formData.append('file', file);

    // Determine type from file extension or MIME type
    let type: 'audio' | 'image' | 'subtitle' | 'video' = 'image';
    if (file.type.startsWith('audio/')) {
      type = 'audio';
    } else if (file.type.startsWith('image/')) {
      type = 'image';
    } else if (file.type.startsWith('video/')) {
      type = 'video';
    } else if (file.name.endsWith('.srt')) {
      type = 'subtitle';
    }

    const response = await apiClient.post<MediaFile>(
      `/admin/media/upload?type=${type}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      }
    );

    return response.data;
  },

  /**
   * Upload a new version of an existing media file
   */
  async uploadNewVersion(
    id: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<MediaFile> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<MediaFile>(
      `/admin/media/${id}/upload-version`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      }
    );

    return response.data;
  },

  /**
   * Delete a media file
   */
  async deleteMedia(id: string): Promise<void> {
    await apiClient.delete(`/admin/media/${id}`);
  },

  /**
   * Get download URL for a media file
   */
  getMediaUrl(storagePath: string): string {
    return `${apiClient.defaults.baseURL}${storagePath}`;
  },
};
