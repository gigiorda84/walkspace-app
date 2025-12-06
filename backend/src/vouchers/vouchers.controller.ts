import { Controller, Post, Get, Body } from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { ValidateVoucherDto, VoucherResponseDto, UserToursResponseDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto';

@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post('validate')
  async validateVoucher(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: ValidateVoucherDto,
  ): Promise<VoucherResponseDto> {
    return this.vouchersService.validateAndRedeemVoucher(user.id, dto);
  }

  @Get('my-tours')
  async getMyTours(
    @CurrentUser() user: UserResponseDto,
  ): Promise<UserToursResponseDto> {
    return this.vouchersService.getUserTours(user.id);
  }
}
