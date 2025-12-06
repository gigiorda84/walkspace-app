import { IsOptional, IsString, IsIn } from 'class-validator';

export class TourListQueryDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsIn(['en', 'it', 'fr'])
  language?: string;
}
