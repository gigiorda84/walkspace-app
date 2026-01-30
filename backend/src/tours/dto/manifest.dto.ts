export class AudioFileDto {
  pointId: string;
  order: number;
  fileUrl: string;
  fileSizeBytes: number;
}

export class ImageFileDto {
  pointId: string;
  fileUrl: string;
  fileSizeBytes: number;
}

export class SubtitleFileDto {
  pointId: string;
  language: string;
  fileUrl: string;
  fileSizeBytes: number;
}

export class OfflineMapDto {
  tilesUrlTemplate: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  recommendedZoomLevels: number[];
}

export class ManifestDto {
  tourId: string;
  language: string;
  version: number;
  audio: AudioFileDto[];
  images: ImageFileDto[];
  subtitles: SubtitleFileDto[];
  offlineMap: OfflineMapDto;
}
