import { IsString, IsNumber, IsEnum, IsOptional, MinLength, Min, Max } from 'class-validator';

export class UpdateVersionDto {
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
  coverImageFileId?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  startingPointLat?: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  startingPointLng?: number;

  @IsString()
  @IsOptional()
  routePolyline?: string;

  @IsEnum(['draft', 'published'])
  @IsOptional()
  status?: 'draft' | 'published';
}
