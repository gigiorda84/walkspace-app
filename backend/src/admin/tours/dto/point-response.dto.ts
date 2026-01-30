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
  // CMS-friendly field mappings
  sequenceOrder?: number;
  latitude?: number;
  longitude?: number;
  triggerRadiusMeters?: number;
  createdAt: Date;
  updatedAt: Date;
  localizations: LocalizationResponseDto[];
}
