import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { CmsLoginDto, CmsUserDto, CmsAuthResponseDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CmsAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: CmsLoginDto): Promise<CmsAuthResponseDto> {
    const cmsUser = await this.prisma.cmsUser.findUnique({
      where: { email: dto.email },
    });

    if (!cmsUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, cmsUser.passwordHash);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user: CmsUserDto = {
      id: cmsUser.id,
      email: cmsUser.email,
      role: cmsUser.role,
      createdAt: cmsUser.createdAt,
    };

    const accessToken = this.jwtService.sign({
      sub: cmsUser.id,
      email: cmsUser.email,
      role: cmsUser.role,
      type: 'cms', // Distinguish from regular user tokens
    });

    return {
      user,
      accessToken,
    };
  }

  async validateCmsUser(userId: string): Promise<CmsUserDto | null> {
    const cmsUser = await this.prisma.cmsUser.findUnique({
      where: { id: userId },
    });

    if (!cmsUser) {
      return null;
    }

    return {
      id: cmsUser.id,
      email: cmsUser.email,
      role: cmsUser.role,
      createdAt: cmsUser.createdAt,
    };
  }
}
