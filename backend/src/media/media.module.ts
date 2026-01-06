import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../common/storage.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService, PrismaService, StorageService],
  exports: [MediaService],
})
export class MediaModule {}
