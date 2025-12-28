// Common types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: CmsUser;
}

export interface CmsUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
  createdAt: string;
}

// Tour types
export interface Tour {
  id: string;
  slug: string;
  defaultCity: string;
  defaultDurationMinutes: number;
  defaultDistanceKm: number;
  isProtected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TourVersion {
  id: string;
  tourId: string;
  language: 'it' | 'fr' | 'en';
  title: string;
  description: string;
  coverImageFileId: string | null;
  status: 'draft' | 'published';
  routePolyline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TourPoint {
  id: string;
  tourId: string;
  latitude: number;
  longitude: number;
  sequenceOrder: number;
  triggerRadiusMeters: number;
  createdAt: string;
}

export interface TourPointLocalization {
  id: string;
  tourPointId: string;
  tourVersionId: string;
  language: 'it' | 'fr' | 'en';
  title: string | null;
  description: string | null;
  audioFileId: string | null;
  imageFileId: string | null;
  subtitleFileId: string | null;
  createdAt: string;
}

// Media types
export interface MediaFile {
  id: string;
  type: 'audio' | 'image' | 'subtitle';
  mimeType: string;
  fileSizeBytes: number;
  url: string;
  version: number;
  isActive: boolean;
  originalFilename?: string;
  filename?: string;
  createdAt: string;
}

// Voucher types
export interface VoucherBatch {
  id: string;
  name: string;
  tourId: string | null;
  quantity: number;
  maxUsesPerCode: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Voucher {
  id: string;
  code: string;
  batchId: string;
  maxUses: number;
  currentUses: number;
  expiresAt: string | null;
  isActive: boolean;
}

// Analytics types
export interface AnalyticsEvent {
  id: string;
  eventType: string;
  userId: string | null;
  tourId: string | null;
  properties: Record<string, any>;
  createdAt: string;
}

export interface TourAnalytics {
  tourId: string;
  downloads: number;
  starts: number;
  completions: number;
  languageBreakdown: {
    language: string;
    count: number;
  }[];
}
