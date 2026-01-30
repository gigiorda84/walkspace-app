export class TourPointLocalizationDto {
  id: string;
  language: string;
  title: string;
  description?: string;
  audioUrl?: string;
  imageUrl?: string;
  subtitleUrl?: string;
}

export class TourPointResponseDto {
  id: string;
  sequence: number;
  latitude: number;
  longitude: number;
  triggerRadiusMeters: number;
  localization?: TourPointLocalizationDto;
}

export class TourPointsResponseDto {
  tourId: string;
  language: string;
  points: TourPointResponseDto[];
}
