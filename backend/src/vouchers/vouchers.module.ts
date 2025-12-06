import { Module } from '@nestjs/common';
import { VouchersController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [VouchersController],
  providers: [VouchersService, PrismaService],
  exports: [VouchersService],
})
export class VouchersModule {}
