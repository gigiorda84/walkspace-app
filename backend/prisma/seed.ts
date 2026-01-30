import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (in correct order due to foreign keys)
  await prisma.analyticsEvent.deleteMany();
  await prisma.voucherRedemption.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.voucherBatch.deleteMany();
  await prisma.userTourAccess.deleteMany();
  await prisma.tourPointLocalization.deleteMany();
  await prisma.tourPoint.deleteMany();
  await prisma.tourVersion.deleteMany();
  await prisma.tour.deleteMany();
  await prisma.mediaFile.deleteMany();
  await prisma.userAuthProvider.deleteMany();
  await prisma.user.deleteMany();
  await prisma.cmsUser.deleteMany();

  console.log('✅ Cleaned existing data');

  // Create CMS User
  const cmsUser = await prisma.cmsUser.create({
    data: {
      email: 'admin@example.com',
      passwordHash: '$2b$10$c537rDfiDjo2wSRHE47uI.xSYMsYIiY5H8cvAcmncudsaP0S7u9RW', // "admin123"
      role: 'admin',
    },
  });
  console.log('✅ Created CMS user (email: admin@example.com, password: admin123)');

  // Create Test User with password
  const testUser = await prisma.user.create({
    data: {
      email: 'user@example.com',
      passwordHash: '$2b$10$6fiCljvxI8n44De0I3pkE.ctezVhErPTmuH.zdeQv.pqPYnG/mev2', // "password123"
      name: 'Test User',
      preferredLanguage: 'en',
      mailingListOptIn: true,
    },
  });
  console.log('✅ Created test user (email: user@example.com, password: password123)');

  // Create Media Files
  const audioFile1 = await prisma.mediaFile.create({
    data: {
      type: 'audio',
      mimeType: 'audio/mpeg',
      fileSizeBytes: 1024000,
      storagePath: '/media/audio/intro.mp3',
    },
  });

  const audioFile2 = await prisma.mediaFile.create({
    data: {
      type: 'audio',
      mimeType: 'audio/mpeg',
      fileSizeBytes: 2048000,
      storagePath: '/media/audio/point1.mp3',
    },
  });

  const imageFile = await prisma.mediaFile.create({
    data: {
      type: 'image',
      mimeType: 'image/jpeg',
      fileSizeBytes: 512000,
      storagePath: '/media/images/cover.jpg',
    },
  });

  const subtitleFile = await prisma.mediaFile.create({
    data: {
      type: 'subtitle',
      mimeType: 'text/srt',
      fileSizeBytes: 5000,
      storagePath: '/media/subtitles/intro-en.srt',
    },
  });
  console.log('✅ Created media files');

  // Create Tour
  const tour = await prisma.tour.create({
    data: {
      slug: 'demo-city-walk',
      defaultCity: 'Demo City',
      defaultDurationMinutes: 60,
      defaultDistanceKm: 3.5,
      isProtected: false,
      coverImageFileId: imageFile.id,
      routePolyline: 'encodedPolylineStringHere',
    },
  });
  console.log('✅ Created tour');

  // Create Tour Version (English)
  const tourVersion = await prisma.tourVersion.create({
    data: {
      tourId: tour.id,
      language: 'en',
      title: 'Demo City Historic Walk',
      description: 'Explore the historic heart of Demo City through an immersive audio experience.',
      status: 'published',
      versionNumber: 1,
      startingPointLat: 45.464203,
      startingPointLng: 9.189982,
    },
  });
  console.log('✅ Created tour version');

  // Create Tour Points
  const point1 = await prisma.tourPoint.create({
    data: {
      tourId: tour.id,
      order: 1,
      lat: 45.464203,
      lng: 9.189982,
      defaultTriggerRadiusMeters: 150,
    },
  });

  const point2 = await prisma.tourPoint.create({
    data: {
      tourId: tour.id,
      order: 2,
      lat: 45.465103,
      lng: 9.190882,
      defaultTriggerRadiusMeters: 200,
    },
  });
  console.log('✅ Created tour points');

  // Create Point Localizations
  await prisma.tourPointLocalization.create({
    data: {
      tourPointId: point1.id,
      tourVersionId: tourVersion.id,
      language: 'en',
      title: 'Historic Square',
      description: 'Welcome to the historic square, the heart of Demo City for centuries.',
      audioFileId: audioFile1.id,
      subtitleFileId: subtitleFile.id,
    },
  });

  await prisma.tourPointLocalization.create({
    data: {
      tourPointId: point2.id,
      tourVersionId: tourVersion.id,
      language: 'en',
      title: 'Ancient Cathedral',
      description: 'Marvel at the Gothic architecture of this 14th-century cathedral.',
      audioFileId: audioFile2.id,
    },
  });
  console.log('✅ Created point localizations');

  // Create Voucher Batch
  const voucherBatch = await prisma.voucherBatch.create({
    data: {
      name: 'Demo Batch 2025',
      description: 'Test voucher batch for development',
      tourId: tour.id,
      createdByUserId: cmsUser.id,
    },
  });

  // Create Voucher
  await prisma.voucher.create({
    data: {
      code: 'DEMO-2025-TEST',
      batchId: voucherBatch.id,
      tourId: tour.id,
      maxUses: 100,
      usesSoFar: 0,
      expiresAt: new Date('2025-12-31'),
    },
  });
  console.log('✅ Created voucher');

  // Grant user access to tour
  await prisma.userTourAccess.create({
    data: {
      userId: testUser.id,
      tourId: tour.id,
      source: 'free',
    },
  });
  console.log('✅ Granted user access to tour');

  // Create some analytics events
  await prisma.analyticsEvent.create({
    data: {
      name: 'tour_viewed',
      userId: testUser.id,
      tourId: tour.id,
      language: 'en',
      device: 'iPhone14,3',
      osVersion: 'iOS 18.0',
      properties: { screen: 'tour_detail' },
    },
  });

  await prisma.analyticsEvent.create({
    data: {
      name: 'tour_started',
      userId: testUser.id,
      tourId: tour.id,
      language: 'en',
      device: 'iPhone14,3',
      osVersion: 'iOS 18.0',
      properties: { offline: true },
    },
  });
  console.log('✅ Created analytics events');

  // Create PROTECTED Tour
  const protectedTour = await prisma.tour.create({
    data: {
      slug: 'premium-milan-experience',
      defaultCity: 'Milan',
      defaultDurationMinutes: 120,
      defaultDistanceKm: 5.0,
      isProtected: true,
      coverImageFileId: imageFile.id,
      routePolyline: 'encodedPolylineStringHere',
    },
  });

  // Create Protected Tour Version (Italian)
  const protectedTourVersion = await prisma.tourVersion.create({
    data: {
      tourId: protectedTour.id,
      language: 'it',
      title: 'Esperienza Premium di Milano',
      description: 'Un tour esclusivo attraverso i tesori nascosti di Milano. Richiede codice voucher.',
      status: 'published',
      versionNumber: 1,
      startingPointLat: 45.464664,
      startingPointLng: 9.188540,
    },
  });

  // Create Points for Protected Tour
  const protectedPoint1 = await prisma.tourPoint.create({
    data: {
      tourId: protectedTour.id,
      order: 1,
      lat: 45.464664,
      lng: 9.188540,
      defaultTriggerRadiusMeters: 150,
    },
  });

  const protectedPoint2 = await prisma.tourPoint.create({
    data: {
      tourId: protectedTour.id,
      order: 2,
      lat: 45.465664,
      lng: 9.189540,
      defaultTriggerRadiusMeters: 150,
    },
  });

  // Create Point Localizations for Protected Tour
  await prisma.tourPointLocalization.create({
    data: {
      tourPointId: protectedPoint1.id,
      tourVersionId: protectedTourVersion.id,
      language: 'it',
      title: 'Piazza del Duomo',
      description: 'Il cuore pulsante di Milano, con la maestosa cattedrale gotica.',
      audioFileId: audioFile1.id,
      imageFileId: imageFile.id,
      subtitleFileId: subtitleFile.id,
    },
  });

  await prisma.tourPointLocalization.create({
    data: {
      tourPointId: protectedPoint2.id,
      tourVersionId: protectedTourVersion.id,
      language: 'it',
      title: 'Galleria Vittorio Emanuele II',
      description: 'La splendida galleria commerciale del XIX secolo.',
      audioFileId: audioFile2.id,
      imageFileId: imageFile.id,
    },
  });

  // Create English version of protected tour
  const protectedTourVersionEN = await prisma.tourVersion.create({
    data: {
      tourId: protectedTour.id,
      language: 'en',
      title: 'Premium Milan Experience',
      description: 'An exclusive tour through the hidden treasures of Milan. Requires voucher code.',
      status: 'published',
      versionNumber: 1,
      startingPointLat: 45.464664,
      startingPointLng: 9.188540,
    },
  });

  await prisma.tourPointLocalization.create({
    data: {
      tourPointId: protectedPoint1.id,
      tourVersionId: protectedTourVersionEN.id,
      language: 'en',
      title: 'Piazza del Duomo',
      description: 'The beating heart of Milan, with the majestic Gothic cathedral.',
      audioFileId: audioFile1.id,
      imageFileId: imageFile.id,
      subtitleFileId: subtitleFile.id,
    },
  });

  await prisma.tourPointLocalization.create({
    data: {
      tourPointId: protectedPoint2.id,
      tourVersionId: protectedTourVersionEN.id,
      language: 'en',
      title: 'Galleria Vittorio Emanuele II',
      description: 'The splendid 19th-century shopping gallery.',
      audioFileId: audioFile2.id,
      imageFileId: imageFile.id,
    },
  });

  // Create French version of protected tour
  const protectedTourVersionFR = await prisma.tourVersion.create({
    data: {
      tourId: protectedTour.id,
      language: 'fr',
      title: 'Expérience Premium de Milan',
      description: 'Une visite exclusive à travers les trésors cachés de Milan. Nécessite un code de bon.',
      status: 'published',
      versionNumber: 1,
      startingPointLat: 45.464664,
      startingPointLng: 9.188540,
    },
  });

  await prisma.tourPointLocalization.create({
    data: {
      tourPointId: protectedPoint1.id,
      tourVersionId: protectedTourVersionFR.id,
      language: 'fr',
      title: 'Piazza del Duomo',
      description: 'Le cœur battant de Milan, avec la majestueuse cathédrale gothique.',
      audioFileId: audioFile1.id,
      imageFileId: imageFile.id,
      subtitleFileId: subtitleFile.id,
    },
  });

  await prisma.tourPointLocalization.create({
    data: {
      tourPointId: protectedPoint2.id,
      tourVersionId: protectedTourVersionFR.id,
      language: 'fr',
      title: 'Galleria Vittorio Emanuele II',
      description: 'La splendide galerie commerciale du XIXe siècle.',
      audioFileId: audioFile2.id,
      imageFileId: imageFile.id,
    },
  });

  console.log('✅ Created protected tour with Italian, English, and French versions');

  // Create Voucher Batch for Protected Tour
  const protectedVoucherBatch = await prisma.voucherBatch.create({
    data: {
      name: 'Premium Access 2025',
      description: 'Premium tour access vouchers',
      tourId: protectedTour.id,
      createdByUserId: cmsUser.id,
    },
  });

  // Create Vouchers for Protected Tour
  await prisma.voucher.create({
    data: {
      code: 'PREMIUM2024',
      batchId: protectedVoucherBatch.id,
      tourId: protectedTour.id,
      maxUses: 50,
      usesSoFar: 0,
      expiresAt: new Date('2025-12-31'),
    },
  });

  await prisma.voucher.create({
    data: {
      code: 'MILAN-VIP-001',
      batchId: protectedVoucherBatch.id,
      tourId: protectedTour.id,
      maxUses: 10,
      usesSoFar: 0,
      expiresAt: new Date('2025-12-31'),
    },
  });

  // Create EXPIRED voucher for testing
  await prisma.voucher.create({
    data: {
      code: 'EXPIRED2024',
      batchId: protectedVoucherBatch.id,
      tourId: protectedTour.id,
      maxUses: 50,
      usesSoFar: 0,
      expiresAt: new Date('2024-01-01'), // Expired
    },
  });

  // Create EXHAUSTED voucher for testing
  await prisma.voucher.create({
    data: {
      code: 'EXHAUSTED2024',
      batchId: protectedVoucherBatch.id,
      tourId: protectedTour.id,
      maxUses: 1,
      usesSoFar: 1, // Already fully used
      expiresAt: new Date('2025-12-31'),
    },
  });

  console.log('✅ Created vouchers for protected tour (including expired and exhausted)');

  console.log('\n🎉 Database seed completed successfully!');
  console.log('\nTest Data Created:');
  console.log('- CMS User: admin@example.com (password: admin123)');
  console.log('- Test User: user@example.com');
  console.log('- Free Tour: Demo City Historic Walk (demo-city-walk) - English only');
  console.log('- Protected Tour: Premium Milan Experience (premium-milan-experience) - Italian, English, French');
  console.log('- Tour Points: 2 per tour');
  console.log('- Voucher Codes:');
  console.log('  - DEMO-2025-TEST (free tour, valid)');
  console.log('  - PREMIUM2024 (protected tour, valid)');
  console.log('  - MILAN-VIP-001 (protected tour, valid)');
  console.log('  - EXPIRED2024 (protected tour, EXPIRED)');
  console.log('  - EXHAUSTED2024 (protected tour, max uses reached)');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
