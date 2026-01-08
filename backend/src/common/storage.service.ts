import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface UploadResult {
  storagePath: string;
  url: string;
}

@Injectable()
export class StorageService {
  private readonly storageProvider: string;
  private readonly s3Client: S3Client | null;
  private readonly bucket: string | null;
  private readonly uploadDir: string;
  private readonly baseUrl: string;
  private readonly publicR2Url: string | null;

  constructor() {
    this.storageProvider = process.env.STORAGE_PROVIDER || 'local';
    this.uploadDir = path.join(process.cwd(), process.env.UPLOAD_PATH || 'uploads');
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.publicR2Url = process.env.PUBLIC_R2_URL || null;

    if (this.storageProvider === 's3') {
      // Initialize S3 client for production (works with S3, R2, Spaces)
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'auto',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
        // For Cloudflare R2, use custom endpoint
        ...(process.env.AWS_ENDPOINT && {
          endpoint: process.env.AWS_ENDPOINT,
        }),
      });
      this.bucket = process.env.AWS_S3_BUCKET!;
    } else {
      // Local storage for development
      this.s3Client = null;
      this.bucket = null;
      this.ensureUploadDir();
    }
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Upload a file to storage (local or cloud)
   */
  async uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<UploadResult> {
    const storagePath = `uploads/${filename}`;

    if (this.storageProvider === 's3' && this.s3Client && this.bucket) {
      // Upload to S3/R2
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: storagePath,
            Body: buffer,
            ContentType: mimeType,
          }),
        );

        // Generate signed URL (valid for 1 hour)
        const url = await this.getSignedUrl(storagePath);

        return { storagePath, url };
      } catch (error) {
        console.error('S3 upload error:', error);
        throw new InternalServerErrorException('Failed to upload file to cloud storage');
      }
    } else {
      // Upload to local filesystem
      const fullPath = path.join(this.uploadDir, filename);
      try {
        await fs.writeFile(fullPath, buffer);
        return {
          storagePath,
          url: `${this.baseUrl}/media/uploads/${filename}`,
        };
      } catch (error) {
        console.error('Local upload error:', error);
        throw new InternalServerErrorException('Failed to upload file to local storage');
      }
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(storagePath: string): Promise<void> {
    if (this.storageProvider === 's3' && this.s3Client && this.bucket) {
      // Delete from S3/R2
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: storagePath,
          }),
        );
      } catch (error) {
        console.warn(`Could not delete file from S3: ${storagePath}`, error);
      }
    } else {
      // Delete from local filesystem
      const fullPath = path.join(process.cwd(), storagePath);
      try {
        await fs.unlink(fullPath);
      } catch (error) {
        console.warn(`Could not delete file from disk: ${fullPath}`, error);
      }
    }
  }

  /**
   * Get a signed URL for a file (for cloud storage) or regular URL (for local)
   */
  async getSignedUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
    if (this.storageProvider === 's3') {
      // If public R2 URL is configured, use it instead of signed URLs
      if (this.publicR2Url) {
        return `${this.publicR2Url}/${storagePath}`;
      }

      // Otherwise generate signed URL for S3/R2
      if (this.s3Client && this.bucket) {
        try {
          const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: storagePath,
          });

          return await getSignedUrl(this.s3Client, command, { expiresIn });
        } catch (error) {
          console.error('Error generating signed URL:', error);
          throw new InternalServerErrorException('Failed to generate file URL');
        }
      }
    }

    // Return local URL
    const filename = path.basename(storagePath);
    return `${this.baseUrl}/media/uploads/${filename}`;
  }

  /**
   * Get the local file path (for local storage only)
   */
  getLocalFilePath(storagePath: string): string {
    if (this.storageProvider === 's3') {
      throw new Error('Cannot get local file path for cloud storage');
    }
    return path.join(process.cwd(), storagePath);
  }

  /**
   * Check if using cloud storage
   */
  isCloudStorage(): boolean {
    return this.storageProvider === 's3';
  }
}
