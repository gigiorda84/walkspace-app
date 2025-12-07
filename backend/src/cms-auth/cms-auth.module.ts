import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CmsAuthController } from './cms-auth.controller';
import { CmsAuthService } from './cms-auth.service';
import { CmsJwtStrategy } from './strategies/cms-jwt.strategy';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'dev-jwt-secret-change-this-in-production',
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [CmsAuthController],
  providers: [CmsAuthService, CmsJwtStrategy, PrismaService],
  exports: [CmsAuthService, CmsJwtStrategy],
})
export class CmsAuthModule {}
