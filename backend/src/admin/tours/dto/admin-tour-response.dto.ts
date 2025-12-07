export class AdminTourVersionDto {
  id: string;
  language: string;
  title: string;
  description: string;
  status: string; // 'draft' | 'published'
  versionNumber: number;
  startingPointLat: number;
  startingPointLng: number;
  routePolyline: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AdminTourResponseDto {
  id: string;
  slug: string;
  defaultCity: string;
  defaultDurationMinutes: number;
  defaultDistanceKm: number;
  isProtected: boolean;
  coverImageFileId: string | null;
  videoFileId: string | null;
  createdAt: Date;
  updatedAt: Date;
  versions: AdminTourVersionDto[];
  pointsCount: number;
}

export class AdminTourListItemDto {
  id: string;
  slug: string;
  defaultCity: string;
  defaultDurationMinutes: number;
  defaultDistanceKm: number;
  isProtected: boolean;
  createdAt: Date;
  updatedAt: Date;
  versionsCount: number;
  publishedVersionsCount: number;
  pointsCount: number;
}
