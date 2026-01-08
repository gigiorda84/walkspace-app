import { Module } from '@nestjs/common';
import { ToursController } from './tours.controller';
import { ToursService } from './tours.service';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../common/storage.service';

@Module({
  controllers: [ToursController],
  providers: [ToursService, PrismaService, StorageService],
  exports: [ToursService],
})
export class ToursModule {}
