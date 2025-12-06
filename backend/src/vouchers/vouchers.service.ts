import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  ValidateVoucherDto,
  VoucherResponseDto,
  UserToursResponseDto,
  UserTourAccessDto,
} from './dto';

@Injectable()
export class VouchersService {
  constructor(private readonly prisma: PrismaService) {}

  async validateAndRedeemVoucher(
    userId: string,
    dto: ValidateVoucherDto,
  ): Promise<VoucherResponseDto> {
    // Normalize code to uppercase for case-insensitive lookup
    const code = dto.code.trim().toUpperCase();

    // Find voucher
    const voucher = await this.prisma.voucher.findUnique({
      where: { code },
      include: {
        tour: {
          include: {
            versions: {
              where: { status: 'published' },
              take: 1,
            },
          },
        },
      },
    });

    if (!voucher) {
      throw new NotFoundException('Invalid voucher code');
    }

    // Check expiration
    if (voucher.expiresAt && voucher.expiresAt < new Date()) {
      throw new BadRequestException('This voucher has expired');
    }

    // Check usage limits
    if (voucher.usesSoFar >= voucher.maxUses) {
      throw new BadRequestException('This voucher has reached its maximum usage limit');
    }

    // Determine tour ID
    const tourId = voucher.tourId;
    if (!tourId) {
      throw new BadRequestException('This voucher is not associated with a tour');
    }

    // Check if user already has access
    const existingAccess = await this.prisma.userTourAccess.findUnique({
      where: {
        userId_tourId: {
          userId,
          tourId,
        },
      },
    });

    if (existingAccess) {
      throw new ConflictException('You already have access to this tour');
    }

    // Atomic transaction: create access + redemption + increment usage
    await this.prisma.$transaction(async (tx) => {
      // Grant access
      await tx.userTourAccess.create({
        data: {
          userId,
          tourId,
          source: 'voucher',
        },
      });

      // Record redemption
      await tx.voucherRedemption.create({
        data: {
          voucherId: voucher.id,
          userId,
          tourId,
        },
      });

      // Increment usage counter
      await tx.voucher.update({
        where: { id: voucher.id },
        data: {
          usesSoFar: {
            increment: 1,
          },
        },
      });
    });

    // Get tour title
    const tourTitle = voucher.tour?.versions[0]?.title || 'Unknown Tour';

    return {
      success: true,
      message: 'Voucher redeemed successfully',
      tourId,
      tourTitle,
    };
  }

  async getUserTours(userId: string): Promise<UserToursResponseDto> {
    const userAccess = await this.prisma.userTourAccess.findMany({
      where: { userId },
      include: {
        tour: {
          include: {
            versions: {
              where: { status: 'published' },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const tours: UserTourAccessDto[] = userAccess
      .filter((access) => access.tour.versions.length > 0)
      .map((access) => ({
        tourId: access.tourId,
        tourTitle: access.tour.versions[0].title,
        tourSlug: access.tour.slug,
        grantedAt: access.createdAt,
      }));

    return { tours };
  }
}
