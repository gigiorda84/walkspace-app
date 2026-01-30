import { IsString, IsNumber, IsBoolean, IsOptional, Min, IsIn } from 'class-validator';

export class UpdateTourDto {
  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  defaultCity?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  defaultDurationMinutes?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  defaultDistanceKm?: number;

  @IsString()
  @IsOptional()
  @IsIn(['facile', 'medio', 'difficile'])
  defaultDifficulty?: string;

  @IsBoolean()
  @IsOptional()
  isProtected?: boolean;

  @IsString()
  @IsOptional()
  coverImageFileId?: string;

  @IsString()
  @IsOptional()
  videoFileId?: string;

  @IsString()
  @IsOptional()
  routePolyline?: string;
}
