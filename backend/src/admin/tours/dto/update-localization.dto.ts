import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateLocalizationDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  title?: string;

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
