import { IsString, IsOptional, MinLength, ValidateIf } from 'class-validator';

export class CreateLocalizationDto {
  @IsString()
  @MinLength(2)
  language: string; // e.g., 'en', 'it', 'fr'

  @IsString()
  @MinLength(1)
  title: string;

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
