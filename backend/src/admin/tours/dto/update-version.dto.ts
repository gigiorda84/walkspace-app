import { IsString, IsNumber, IsEnum, IsOptional, MinLength, Min, Max, ValidateIf } from 'class-validator';

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
  completionMessage?: string;

  @ValidateIf((o) => o.coverImageFileId !== null)
  @IsString()
  @IsOptional()
  coverImageFileId?: string | null;

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

  @IsEnum(['draft', 'published'])
  @IsOptional()
  status?: 'draft' | 'published';
}
