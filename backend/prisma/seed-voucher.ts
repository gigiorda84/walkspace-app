import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get the demo tour
  const tour = await prisma.tour.findFirst({
    where: { slug: 'demo-city-walk' },
  });

  if (!tour) {
    console.error('Demo tour not found!');
    return;
  }

  // Create a test voucher
  const voucher = await prisma.voucher.create({
    data: {
      code: 'DEMO2025',
      tourId: tour.id,
      maxUses: 10,
      usesSoFar: 0,
      expiresAt: new Date('2025-12-31'),
    },
  });

  console.log('Created voucher:', voucher);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
