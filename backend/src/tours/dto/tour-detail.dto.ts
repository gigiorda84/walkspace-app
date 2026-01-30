export class TourDetailDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  completionMessage?: string;
  busInfo?: string;
  city: string;
  durationMinutes: number;
  distanceKm: number;
  difficulty: string;
  languages: string[];
  isProtected: boolean;
  imageUrl: string | null;
  coverTrailerUrl: string | null;
  startingPoint: {
    lat: number;
    lng: number;
  };
  routePolyline: string | null;
  downloadInfo: {
    estimatedSizeMb: number;
    isDownloaded: boolean;
  };
  hasAccess: boolean;
}
