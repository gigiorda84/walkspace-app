import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

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
      email: 'admin@walkspace.org',
      passwordHash: '$2b$10$dummyhashforseeddataonly',  // In real app, properly hash passwords
      role: 'admin',
    },
  });
  console.log('✅ Created CMS user');

  // Create Test User
  const testUser = await prisma.user.create({
    data: {
      email: 'user@example.com',
      name: 'Test User',
      preferredLanguage: 'en',
      mailingListOptIn: true,
    },
  });
  console.log('✅ Created test user');

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
      routePolyline: 'encodedPolylineStringHere',
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

  console.log('\n🎉 Database seed completed successfully!');
  console.log('\nTest Data Created:');
  console.log('- CMS User: admin@walkspace.org');
  console.log('- Test User: user@example.com');
  console.log('- Tour: Demo City Historic Walk');
  console.log('- Tour Points: 2');
  console.log('- Voucher Code: DEMO-2025-TEST');
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
