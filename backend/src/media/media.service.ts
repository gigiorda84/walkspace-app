import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UploadResponseDto } from './dto';
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
      },
    });

    return {
      id: mediaFile.id,
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `${this.baseUrl}/media/${mediaFile.id}`,
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
      subtitle: ['text/plain', 'application/x-subrip', 'text/srt'],
      video: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'],
    };

    if (!allowedMimeTypes[type].includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type for ${type}. Allowed types: ${allowedMimeTypes[type].join(', ')}`,
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
}
