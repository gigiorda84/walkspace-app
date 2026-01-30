export class TourListItemDto {
  id: string;
  slug: string;
  title: Record<string, string>; // { "it": "...", "fr": "...", "en": "..." }
  descriptionPreview: Record<string, string>;
  completionMessage?: Record<string, string>; // { "it": "...", "fr": "...", "en": "..." }
  busInfo?: Record<string, string>; // { "it": "...", "fr": "...", "en": "..." }
  city: string;
  durationMinutes: number;
  distanceKm: number;
  difficulty: string;
  languages: string[];
  isProtected: boolean;
  imageUrl: string | null;
  coverTrailerUrl: string | null;
  routePolyline: string | null; // Route coordinates for map display
  hasAccess?: boolean; // Whether current user has access
}
