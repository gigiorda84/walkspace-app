import { Controller, Post } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('setup')
export class SetupController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Post('create-admin')
  async createAdmin() {
    // Check if any admin exists
    const existing = await this.prisma.cmsUser.count();

    if (existing > 0) {
      return {
        message: 'Admin user already exists',
        email: 'admin@example.com',
      };
    }

    // Create admin user
    const admin = await this.prisma.cmsUser.create({
      data: {
        email: 'admin@example.com',
        passwordHash:
          '$2b$10$c537rDfiDjo2wSRHE47uI.xSYMsYIiY5H8cvAcmncudsaP0S7u9RW', // "admin123"
        role: 'admin',
      },
    });

    return {
      message: 'Admin user created successfully',
      email: admin.email,
      password: 'admin123',
      warning: 'Please change the password after first login!',
    };
  }
}
