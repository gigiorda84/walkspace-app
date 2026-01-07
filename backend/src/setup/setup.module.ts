import { Module } from '@nestjs/common';
import { SetupController } from './setup.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [SetupController],
  providers: [PrismaService],
})
export class SetupModule {}
