import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
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
}
