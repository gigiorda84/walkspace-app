import { Module } from '@nestjs/common';
import { AdminToursController } from './admin-tours.controller';
import { AdminToursService } from './admin-tours.service';
import { PrismaService } from '../../prisma.service';
import { CmsAuthModule } from '../../cms-auth/cms-auth.module';

@Module({
  imports: [CmsAuthModule],
  controllers: [AdminToursController],
  providers: [AdminToursService, PrismaService],
  exports: [AdminToursService],
})
export class AdminToursModule {}
