import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('BANDITE Sonic Walkscape API')
    .setDescription(
      'Backend API for BANDITE Sonic Walkscape - GPS-triggered audio walking tours. ' +
      'Provides endpoints for mobile apps (tour discovery, downloads, analytics) and ' +
      'CMS (tour management, content editing, voucher generation).'
    )
    .setVersion('1.0')
    .addTag('auth', 'Authentication - User registration, login, and token management')
    .addTag('tours', 'Mobile Tours API - Tour discovery and content access')
    .addTag('vouchers', 'Vouchers - Redeem codes and manage tour access')
    .addTag('analytics', 'Analytics - Event tracking and user behavior')
    .addTag('admin-tours', 'CMS Tours - Tour creation and management')
    .addTag('admin-versions', 'CMS Versions - Language version management')
    .addTag('admin-points', 'CMS Points - GPS waypoint management')
    .addTag('admin-localizations', 'CMS Localizations - Multilingual content')
    .addTag('admin-media', 'CMS Media - File uploads and management')
    .addTag('admin-vouchers', 'CMS Vouchers - Batch generation and tracking')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controllers
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'BANDITE API Docs',
    customfavIcon: 'https://bandite.org/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  await app.listen(process.env.PORT ?? 3000);

  console.log(`🚀 Server running on http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📚 API Documentation: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}
bootstrap();
