export class UploadResponseDto {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  version?: number;
  language?: string;
  uploadedAt: Date;
}
