export class VersionResponseDto {
  id: string;
  tourId: string;
  language: string;
  title: string;
  description: string;
  completionMessage: string | null;
  busInfo: string | null;
  coverImageFileId: string | null;
  coverTrailerFileId: string | null;
  status: 'draft' | 'published';
  versionNumber: number;
  startingPointLat: number;
  startingPointLng: number;
  createdAt: Date;
  updatedAt: Date;
}
