import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CmsAuthController } from './cms-auth.controller';
import { CmsAuthService } from './cms-auth.service';
import { CmsJwtStrategy } from './strategies/cms-jwt.strategy';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [CmsAuthController],
  providers: [CmsAuthService, CmsJwtStrategy, PrismaService],
  exports: [CmsAuthService],
})
export class CmsAuthModule {}
