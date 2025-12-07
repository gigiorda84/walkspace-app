export class LocalizationResponseDto {
  id: string;
  tourPointId: string;
  tourVersionId: string;
  language: string;
  title: string;
  description: string;
  audioFileId: string | null;
  imageFileId: string | null;
  subtitleFileId: string | null;
}

export class PointResponseDto {
  id: string;
  tourId: string;
  order: number;
  lat: number;
  lng: number;
  defaultTriggerRadiusMeters: number;
  createdAt: Date;
  updatedAt: Date;
  localizations: LocalizationResponseDto[];
}
