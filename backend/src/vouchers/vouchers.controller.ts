import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VouchersService } from './vouchers.service';
import { ValidateVoucherDto, VoucherResponseDto, UserToursResponseDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto';

@ApiTags('vouchers')
@ApiBearerAuth('JWT-auth')
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post('validate')
  @ApiOperation({
    summary: 'Validate and redeem voucher',
    description: 'Redeem a voucher code to unlock access to a protected tour. Returns tour information and access details.'
  })
  @ApiResponse({
    status: 200,
    description: 'Voucher successfully redeemed',
    type: VoucherResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Voucher expired, exhausted, or invalid'
  })
  @ApiResponse({
    status: 401,
    description: 'User not authenticated'
  })
  @ApiResponse({
    status: 404,
    description: 'Voucher code not found'
  })
  @ApiResponse({
    status: 409,
    description: 'User already has access to this tour'
  })
  async validateVoucher(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: ValidateVoucherDto,
  ): Promise<VoucherResponseDto> {
    return this.vouchersService.validateAndRedeemVoucher(user.id, dto);
  }

  @Get('my-tours')
  @ApiOperation({
    summary: 'Get user\'s unlocked tours',
    description: 'Retrieve all tours the authenticated user has access to (both free and voucher-unlocked).'
  })
  @ApiResponse({
    status: 200,
    description: 'User tours retrieved successfully',
    type: UserToursResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'User not authenticated'
  })
  async getMyTours(
    @CurrentUser() user: UserResponseDto,
  ): Promise<UserToursResponseDto> {
    return this.vouchersService.getUserTours(user.id);
  }
}
