import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpdatePointDto {
  @IsNumber()
  @IsOptional()
  order?: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  lat?: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  lng?: number;

  @IsNumber()
  @IsOptional()
  @Min(5)
  @Max(500)
  defaultTriggerRadiusMeters?: number;
}
