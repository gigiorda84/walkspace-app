import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateLocalizationDto {
  @IsString()
  @MinLength(2)
  language: string; // e.g., 'en', 'it', 'fr'

  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  description: string;

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
