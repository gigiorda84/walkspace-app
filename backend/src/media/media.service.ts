import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UploadResponseDto, MediaFileListItemDto, MediaFileResponseDto } from './dto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Express } from 'express';

@Injectable()
export class MediaService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  constructor(private readonly prisma: PrismaService) {
    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    type: 'audio' | 'image' | 'subtitle' | 'video',
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
    const storagePath = `uploads/${filename}`;
    const fullPath = path.join(this.uploadDir, filename);

    // Save file to disk
    await fs.writeFile(fullPath, file.buffer);

    // Create MediaFile record in database
    const mediaFile = await this.prisma.mediaFile.create({
      data: {
        type,
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
      url: `${this.baseUrl}/media/${mediaFile.id}`,
      version: mediaFile.version,
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

    return `${this.baseUrl}/media/${fileId}`;
  }

  async getFilePath(fileId: string): Promise<string> {
    const mediaFile = await this.prisma.mediaFile.findUnique({
      where: { id: fileId },
    });

    if (!mediaFile) {
      throw new BadRequestException('File not found');
    }

    return path.join(process.cwd(), mediaFile.storagePath);
  }

  async listFiles(type?: string): Promise<MediaFileListItemDto[]> {
    const where = type ? { type } : {};

    const files = await this.prisma.mediaFile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return files.map((file) => ({
      id: file.id,
      type: file.type,
      mimeType: file.mimeType,
      fileSizeBytes: file.fileSizeBytes,
      url: `${this.baseUrl}/media/${file.id}`,
      version: file.version,
      isActive: file.isActive,
      originalFilename: file.originalFilename ?? undefined,
      createdAt: file.createdAt,
    }));
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
      mimeType: mediaFile.mimeType,
      fileSizeBytes: mediaFile.fileSizeBytes,
      storagePath: mediaFile.storagePath,
      url: `${this.baseUrl}/media/${mediaFile.id}`,
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

    // Delete physical file from disk
    const fullPath = path.join(process.cwd(), mediaFile.storagePath);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      // File might not exist on disk, continue with database deletion
      console.warn(`Could not delete file from disk: ${fullPath}`, error);
    }

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
    const storagePath = `uploads/${filename}`;
    const fullPath = path.join(this.uploadDir, filename);

    // Save file to disk
    await fs.writeFile(fullPath, file.buffer);

    // Mark old version as inactive
    await this.prisma.mediaFile.update({
      where: { id: oldFileId },
      data: { isActive: false },
    });

    // Create new MediaFile record
    const newMediaFile = await this.prisma.mediaFile.create({
      data: {
        type: oldMediaFile.type,
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
      url: `${this.baseUrl}/media/${newMediaFile.id}`,
      uploadedAt: newMediaFile.createdAt,
    };
  }
}
