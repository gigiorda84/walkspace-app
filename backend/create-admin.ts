import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Creating admin user...');

  // Check if admin already exists
  const existing = await prisma.cmsUser.findUnique({
    where: { email: 'admin@example.com' },
  });

  if (existing) {
    console.log('✅ Admin user already exists');
    return;
  }

  // Create admin user
  const admin = await prisma.cmsUser.create({
    data: {
      email: 'admin@example.com',
      passwordHash:
        '$2b$10$c537rDfiDjo2wSRHE47uI.xSYMsYIiY5H8cvAcmncudsaP0S7u9RW', // "admin123"
      role: 'admin',
    },
  });

  console.log('✅ Created admin user:', admin.email);
  console.log('📧 Email: admin@example.com');
  console.log('🔑 Password: admin123');
  console.log('⚠️  Please change the password after first login!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
