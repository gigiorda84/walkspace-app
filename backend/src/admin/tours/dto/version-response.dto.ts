export class VersionResponseDto {
  id: string;
  tourId: string;
  language: string;
  title: string;
  description: string;
  coverImageFileId: string | null;
  status: 'draft' | 'published';
  versionNumber: number;
  startingPointLat: number;
  startingPointLng: number;
  routePolyline: string | null;
  createdAt: Date;
  updatedAt: Date;
}
