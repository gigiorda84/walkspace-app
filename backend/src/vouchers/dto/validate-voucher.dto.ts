import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateVoucherDto {
  @ApiProperty({
    description: 'Voucher code to validate and redeem',
    example: 'PREMIUM2024',
    minLength: 1,
  })
  @IsNotEmpty()
  @IsString()
  code: string;
}
