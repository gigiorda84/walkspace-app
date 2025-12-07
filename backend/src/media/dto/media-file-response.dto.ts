export class MediaFileResponseDto {
  id: string;
  type: string;
  mimeType: string;
  fileSizeBytes: number;
  storagePath: string;
  url: string;
  createdAt: Date;
}

export class MediaFileListItemDto {
  id: string;
  type: string;
  mimeType: string;
  fileSizeBytes: number;
  url: string;
  createdAt: Date;
}
