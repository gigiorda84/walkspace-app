import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['it', 'fr', 'en'])
  preferredLanguage?: string;

  @IsOptional()
  @IsBoolean()
  mailingListOptIn?: boolean;
}
