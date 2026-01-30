import { IsString, IsOptional, IsBoolean, IsObject, IsEnum, IsDateString } from 'class-validator';

export enum AnalyticsEventType {
  // App Lifecycle
  APP_OPEN = 'app_open',
  SIGNUP = 'signup',
  LOGIN = 'login',

  // Tour Engagement
  TOUR_VIEWED = 'tour_viewed',
  TOUR_DOWNLOAD_STARTED = 'tour_download_started',
  TOUR_DOWNLOAD_COMPLETED = 'tour_download_completed',
  TOUR_DOWNLOAD_DELETED = 'tour_download_deleted',
  TOUR_STARTED = 'tour_started',
  POINT_TRIGGERED = 'point_triggered',
  TOUR_COMPLETED = 'tour_completed',
  TOUR_ABANDONED = 'tour_abandoned',

  // Post-Tour Engagement
  FOLLOW_US_CLICKED = 'follow_us_clicked',
  CONTACT_CLICKED = 'contact_clicked',

  // Monetization
  VOUCHER_REDEEMED = 'voucher_redeemed',
  DONATION_LINK_CLICKED = 'donation_link_clicked',
}

export class TrackEventDto {
  @IsEnum(AnalyticsEventType)
  name: AnalyticsEventType;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  anonymousId?: string;

  @IsOptional()
  @IsString()
  tourId?: string;

  @IsOptional()
  @IsString()
  pointId?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  device?: string;

  @IsOptional()
  @IsString()
  osVersion?: string;

  @IsOptional()
  @IsBoolean()
  offline?: boolean;

  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;
}
