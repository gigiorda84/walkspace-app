export class MediaFileResponseDto {
  id: string;
  type: string;
  language?: string;
  mimeType: string;
  fileSizeBytes: number;
  storagePath: string;
  url: string;
  version: number;
  isActive: boolean;
  originalFilename?: string;
  createdAt: Date;
}

export class MediaFileListItemDto {
  id: string;
  type: string;
  language?: string;
  mimeType: string;
  fileSizeBytes: number;
  url: string;
  version: number;
  isActive: boolean;
  originalFilename?: string;
  createdAt: Date;
}
