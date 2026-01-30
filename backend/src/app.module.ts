import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CmsAuthModule } from './cms-auth/cms-auth.module';
import { UsersModule } from './users/users.module';
import { ToursModule } from './tours/tours.module';
import { MediaModule } from './media/media.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminToursModule } from './admin/tours/admin-tours.module';
import { AdminMediaModule } from './admin/media/admin-media.module';
import { AdminAnalyticsModule } from './admin/analytics/admin-analytics.module';
import { SetupModule } from './setup/setup.module';
import { FeedbackModule } from './feedback/feedback.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TerminusModule,
    AuthModule,
    CmsAuthModule,
    UsersModule,
    ToursModule,
    MediaModule,
    VouchersModule,
    AnalyticsModule,
    AdminToursModule,
    AdminMediaModule,
    AdminAnalyticsModule,
    SetupModule,
    FeedbackModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [PrismaService],
})
export class AppModule {}
