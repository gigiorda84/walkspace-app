export class TourDetailResponseDto {
  id: string;
  slug: string;
  city: string;
  isProtected: boolean;
  coverImageUrl?: string;
  videoUrl?: string;

  // Language-specific version
  version: {
    id: string;
    language: string;
    title: string;
    description: string;
    coverImageUrl?: string;
    duration: number;
    distance: number;
    status: string;
    routePolyline?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}
