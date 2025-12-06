import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateVoucherDto {
  @IsNotEmpty()
  @IsString()
  code: string;
}
