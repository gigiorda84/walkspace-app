import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UploadResponseDto, MediaFileListItemDto, MediaFileResponseDto } from './dto';
import * as path from 'path';
import { Express } from 'express';
import { StorageService } from '../common/storage.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    type: 'audio' | 'image' | 'subtitle' | 'video',
    language?: string,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    this.validateFileType(file, type);

    // Validate file size (50MB limit for audio)
    this.validateFileSize(file, type);

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;

    // Upload to storage (local or cloud)
    const { storagePath, url } = await this.storageService.uploadFile(
      file.buffer,
      filename,
      file.mimetype,
    );

    // Create MediaFile record in database
    const mediaFile = await this.prisma.mediaFile.create({
      data: {
        type,
        language: language || null,
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
        storagePath,
        originalFilename: file.originalname,
        version: 1,
        isActive: true,
      },
    });

    return {
      id: mediaFile.id,
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: await this.storageService.getSignedUrl(storagePath),
      version: mediaFile.version,
      language: mediaFile.language ?? undefined,
      uploadedAt: mediaFile.createdAt,
    };
  }

  private validateFileType(
    file: Express.Multer.File,
    type: 'audio' | 'image' | 'subtitle' | 'video',
  ) {
    const allowedMimeTypes = {
      audio: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav'],
      image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      subtitle: ['text/plain', 'application/x-subrip', 'text/srt', 'application/octet-stream'],
      video: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'],
    };

    // Special handling for subtitle files - check file extension as fallback
    if (type === 'subtitle' && file.originalname.toLowerCase().endsWith('.srt')) {
      return; // Valid .srt file regardless of MIME type
    }

    if (!allowedMimeTypes[type].includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type for ${type}. Allowed types: ${allowedMimeTypes[type].join(', ')}. Got: ${file.mimetype}`,
      );
    }
  }

  private validateFileSize(
    file: Express.Multer.File,
    type: 'audio' | 'image' | 'subtitle' | 'video',
  ) {
    const maxSizes = {
      audio: 50 * 1024 * 1024, // 50MB
      image: 10 * 1024 * 1024, // 10MB
      subtitle: 1 * 1024 * 1024, // 1MB
      video: 500 * 1024 * 1024, // 500MB
    };

    if (file.size > maxSizes[type]) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size for ${type} (${maxSizes[type] / 1024 / 1024}MB)`,
      );
    }
  }

  async getFileUrl(fileId: string): Promise<string> {
    const mediaFile = await this.prisma.mediaFile.findUnique({
      where: { id: fileId },
    });

    if (!mediaFile) {
      throw new BadRequestException('File not found');
    }

    return this.storageService.getSignedUrl(mediaFile.storagePath);
  }

  async getFilePath(fileId: string): Promise<string> {
    const mediaFile = await this.prisma.mediaFile.findUnique({
      where: { id: fileId },
    });

    if (!mediaFile) {
      throw new BadRequestException('File not found');
    }

    if (this.storageService.isCloudStorage()) {
      throw new BadRequestException('Cannot get file path for cloud storage, use getFileUrl instead');
    }

    return this.storageService.getLocalFilePath(mediaFile.storagePath);
  }

  async listFiles(type?: string, language?: string): Promise<MediaFileListItemDto[]> {
    const where: any = {};
    if (type) where.type = type;
    if (language) where.language = language;

    const files = await this.prisma.mediaFile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      files.map(async (file) => ({
        id: file.id,
        type: file.type,
        language: file.language ?? undefined,
        mimeType: file.mimeType,
        fileSizeBytes: file.fileSizeBytes,
        url: await this.storageService.getSignedUrl(file.storagePath),
        version: file.version,
        isActive: file.isActive,
        originalFilename: file.originalFilename ?? undefined,
        createdAt: file.createdAt,
      })),
    );
  }

  async getFileById(fileId: string): Promise<MediaFileResponseDto> {
    const mediaFile = await this.prisma.mediaFile.findUnique({
      where: { id: fileId },
    });

    if (!mediaFile) {
      throw new NotFoundException('File not found');
    }

    return {
      id: mediaFile.id,
      type: mediaFile.type,
      language: mediaFile.language ?? undefined,
      mimeType: mediaFile.mimeType,
      fileSizeBytes: mediaFile.fileSizeBytes,
      storagePath: mediaFile.storagePath,
      url: await this.storageService.getSignedUrl(mediaFile.storagePath),
      version: mediaFile.version,
      isActive: mediaFile.isActive,
      originalFilename: mediaFile.originalFilename ?? undefined,
      createdAt: mediaFile.createdAt,
    };
  }

  async deleteFile(fileId: string): Promise<void> {
    const mediaFile = await this.prisma.mediaFile.findUnique({
      where: { id: fileId },
    });

    if (!mediaFile) {
      throw new NotFoundException('File not found');
    }

    // Delete physical file from storage
    await this.storageService.deleteFile(mediaFile.storagePath);

    // Delete database record
    await this.prisma.mediaFile.delete({
      where: { id: fileId },
    });
  }

  async uploadNewVersion(
    oldFileId: string,
    file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    // Get the old media file
    const oldMediaFile = await this.prisma.mediaFile.findUnique({
      where: { id: oldFileId },
    });

    if (!oldMediaFile) {
      throw new NotFoundException('Original file not found');
    }

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type matches original
    this.validateFileType(file, oldMediaFile.type as 'audio' | 'image' | 'subtitle' | 'video');
    this.validateFileSize(file, oldMediaFile.type as 'audio' | 'image' | 'subtitle' | 'video');

    // Generate unique filename with version suffix
    const fileExtension = path.extname(file.originalname);
    const newVersion = oldMediaFile.version + 1;
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}-v${newVersion}${fileExtension}`;

    // Upload to storage (local or cloud)
    const { storagePath } = await this.storageService.uploadFile(
      file.buffer,
      filename,
      file.mimetype,
    );

    // Mark old version as inactive
    await this.prisma.mediaFile.update({
      where: { id: oldFileId },
      data: { isActive: false },
    });

    // Create new MediaFile record
    const newMediaFile = await this.prisma.mediaFile.create({
      data: {
        type: oldMediaFile.type,
        language: oldMediaFile.language,
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
        storagePath,
        originalFilename: file.originalname,
        version: newVersion,
        isActive: true,
      },
    });

    return {
      id: newMediaFile.id,
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: await this.storageService.getSignedUrl(storagePath),
      language: newMediaFile.language ?? undefined,
      uploadedAt: newMediaFile.createdAt,
    };
  }
}
