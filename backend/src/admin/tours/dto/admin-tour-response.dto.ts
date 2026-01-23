export class AdminTourVersionDto {
  id: string;
  language: string;
  title: string;
  description: string;
  status: string; // 'draft' | 'published'
  versionNumber: number;
  startingPointLat: number;
  startingPointLng: number;
  createdAt: Date;
  updatedAt: Date;
}

export class AdminTourResponseDto {
  id: string;
  slug: string;
  defaultCity: string;
  defaultDurationMinutes: number;
  defaultDistanceKm: number;
  defaultDifficulty: string;
  isProtected: boolean;
  coverImageFileId: string | null;
  videoFileId: string | null;
  routePolyline: string | null;
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
  defaultDifficulty: string;
  isProtected: boolean;
  createdAt: Date;
  updatedAt: Date;
  versionsCount: number;
  publishedVersionsCount: number;
  pointsCount: number;
  languages: string[];
}
