export class TourResponseDto {
  id: string;
  slug: string;
  city: string;
  isProtected: boolean;
  coverImageUrl?: string;
  videoUrl?: string;

  // Language-specific fields
  title: string;
  description: string;
  language: string;
  duration: number;
  distance: number;

  createdAt: Date;
  updatedAt: Date;
}
