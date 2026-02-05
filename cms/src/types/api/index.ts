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
  defaultDifficulty?: string;
  isProtected: boolean;
  routePolyline: string | null;
  createdAt: string;
  updatedAt: string;
  versionsCount?: number;
  publishedVersionsCount?: number;
  pointsCount?: number;
  languages?: string[];
}

export interface TourVersion {
  id: string;
  tourId: string;
  language: 'it' | 'fr' | 'en';
  title: string;
  description: string;
  completionMessage?: string | null;
  busInfo?: string | null;
  coverImageFileId: string | null;
  coverTrailerFileId?: string | null;
  status: 'draft' | 'published';
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
  type: 'audio' | 'image' | 'subtitle' | 'video';
  language?: 'en' | 'fr' | 'it';
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
export interface AnalyticsOverview {
  totalStarts: number;
  totalCompletions: number;
  uniqueDevices: number;
  platformBreakdown: {
    ios: number;
    android: number;
  };
  triggerBreakdown: {
    gps: number;
    manual: number;
  };
}

export interface DurationAnalytics {
  avgDurationGpsCompleted: number;
  avgDurationManualCompleted: number;
  avgDurationAbandoned: number;
  totalGpsCompleted: number;
  totalManualCompleted: number;
  totalAbandoned: number;
}

export interface ChannelBreakdown {
  channel: string;
  clicks: number;
  percentOfCompletions: number;
}

export interface EngagementAnalytics {
  followUsClicks: number;
  followUsPercent: number;
  totalContactClicks: number;
  totalContactPercent: number;
  channelBreakdown: ChannelBreakdown[];
  donationClicks: number;
  donationPercent: number;
  totalCompletions: number;
}

export interface TourAnalyticsItem {
  tourId: string;
  tourName: string;
  starts: number;
  completions: number;
  completionRate: number;
  avgDurationMinutes: number;
  gpsTriggered: number;
  manualTriggered: number;
}

export interface SessionItem {
  tourId: string;
  tourName: string;
  startedAt: string;
  device: string;
  osVersion: string;
  status: 'completed' | 'abandoned' | 'in-progress';
  durationMinutes: number | null;
  pointsTriggered: number;
  triggerType: string | null;
  language: string | null;
}
