import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiPropertyOptional({ description: 'Email address (required if subscribing to newsletter)' })
  @ValidateIf((o) => o.subscribeToNewsletter === true)
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Name (optional)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Feedback message (optional)' })
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiProperty({ description: 'Subscribe to newsletter', default: false })
  @IsBoolean()
  subscribeToNewsletter: boolean = false;
}
