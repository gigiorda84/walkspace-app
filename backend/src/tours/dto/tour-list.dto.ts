export class TourListItemDto {
  id: string;
  slug: string;
  title: Record<string, string>; // { "it": "...", "fr": "...", "en": "..." }
  descriptionPreview: Record<string, string>;
  completionMessage?: Record<string, string>; // { "it": "...", "fr": "...", "en": "..." }
  city: string;
  durationMinutes: number;
  distanceKm: number;
  languages: string[];
  isProtected: boolean;
  imageUrl: string | null;
  hasAccess?: boolean; // Whether current user has access
}
