import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserProfileDto, UpdateUserProfileDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      preferredLanguage: user.preferredLanguage,
      mailingListOptIn: user.mailingListOptIn,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto): Promise<UserProfileDto> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name !== undefined ? dto.name : undefined,
        preferredLanguage: dto.preferredLanguage !== undefined ? dto.preferredLanguage : undefined,
        mailingListOptIn: dto.mailingListOptIn !== undefined ? dto.mailingListOptIn : undefined,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      preferredLanguage: user.preferredLanguage,
      mailingListOptIn: user.mailingListOptIn,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
