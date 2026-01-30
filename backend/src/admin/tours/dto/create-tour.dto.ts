import { IsString, IsNumber, IsBoolean, IsOptional, Min, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTourDto {
  @ApiProperty({
    description: 'Unique URL-friendly identifier for the tour',
    example: 'milan-historic-center',
    pattern: '^[a-z0-9-]+$',
  })
  @IsString()
  slug: string;

  @ApiProperty({
    description: 'Default city where the tour takes place',
    example: 'Milan',
  })
  @IsString()
  defaultCity: string;

  @ApiProperty({
    description: 'Estimated duration in minutes',
    example: 60,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  defaultDurationMinutes: number;

  @ApiProperty({
    description: 'Total walking distance in kilometers',
    example: 2.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  defaultDistanceKm: number;

  @ApiProperty({
    description: 'Tour difficulty level',
    example: 'facile',
    enum: ['facile', 'medio', 'difficile'],
    default: 'facile',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['facile', 'medio', 'difficile'])
  defaultDifficulty?: string;

  @ApiProperty({
    description: 'Whether the tour requires a voucher to access',
    example: false,
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isProtected?: boolean;

  @ApiProperty({
    description: 'ID of uploaded cover image file',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsString()
  @IsOptional()
  coverImageFileId?: string;

  @ApiProperty({
    description: 'ID of uploaded preview video file',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsString()
  @IsOptional()
  videoFileId?: string;

  @ApiProperty({
    description: 'Route polyline in format: "lat1,lng1;lat2,lng2;..."',
    example: '45.464203,9.189982;45.465203,9.190982',
    required: false,
  })
  @IsString()
  @IsOptional()
  routePolyline?: string;
}
