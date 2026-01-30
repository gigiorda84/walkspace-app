import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreatePointDto {
  @IsNumber()
  order: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @IsNumber()
  @IsOptional()
  @Min(5)
  @Max(500)
  defaultTriggerRadiusMeters?: number; // Defaults to 150 in schema
}
