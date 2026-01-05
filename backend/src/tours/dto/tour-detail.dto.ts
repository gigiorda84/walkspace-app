export class TourDetailDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  completionMessage?: string;
  city: string;
  durationMinutes: number;
  distanceKm: number;
  languages: string[];
  isProtected: boolean;
  imageUrl: string | null;
  startingPoint: {
    lat: number;
    lng: number;
  };
  routePreview: {
    polyline: string | null;
  };
  downloadInfo: {
    estimatedSizeMb: number;
    isDownloaded: boolean;
  };
  hasAccess: boolean;
}
