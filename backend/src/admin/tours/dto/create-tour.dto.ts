import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateTourDto {
  @IsString()
  slug: string;

  @IsString()
  defaultCity: string;

  @IsNumber()
  @Min(1)
  defaultDurationMinutes: number;

  @IsNumber()
  @Min(0)
  defaultDistanceKm: number;

  @IsBoolean()
  @IsOptional()
  isProtected?: boolean;

  @IsString()
  @IsOptional()
  coverImageFileId?: string;

  @IsString()
  @IsOptional()
  videoFileId?: string;
}
