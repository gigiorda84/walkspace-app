import { IsString, IsOptional, MinLength, ValidateIf } from 'class-validator';

export class UpdateLocalizationDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  title?: string;

  @ValidateIf((o) => o.description !== '' && o.description !== null && o.description !== undefined)
  @IsString()
  @MinLength(1)
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  audioFileId?: string;

  @IsString()
  @IsOptional()
  imageFileId?: string;

  @IsString()
  @IsOptional()
  subtitleFileId?: string;
}
