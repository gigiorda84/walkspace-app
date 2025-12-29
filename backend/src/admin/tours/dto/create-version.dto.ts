import { IsString, IsNumber, IsEnum, IsOptional, MinLength, Min, Max } from 'class-validator';

export class CreateVersionDto {
  @IsString()
  @MinLength(2)
  language: string; // e.g., 'en', 'it', 'fr'

  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
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
  routePolyline?: string; // Encoded polyline for the route

  @IsEnum(['draft', 'published'])
  @IsOptional()
  status?: 'draft' | 'published';
}
