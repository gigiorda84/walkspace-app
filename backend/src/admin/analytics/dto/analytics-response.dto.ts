import { ApiProperty } from '@nestjs/swagger';

// Overview Response
export class PlatformBreakdownDto {
  @ApiProperty({ example: 150 })
  ios: number;

  @ApiProperty({ example: 80 })
  android: number;
}

export class TriggerBreakdownDto {
  @ApiProperty({ example: 120 })
  gps: number;

  @ApiProperty({ example: 110 })
  manual: number;
}

export class AnalyticsOverviewDto {
  @ApiProperty({ example: 230 })
  totalStarts: number;

  @ApiProperty({ example: 185 })
  totalCompletions: number;

  @ApiProperty({ example: 142 })
  uniqueDevices: number;

  @ApiProperty({ type: PlatformBreakdownDto })
  platformBreakdown: PlatformBreakdownDto;

  @ApiProperty({ type: TriggerBreakdownDto })
  triggerBreakdown: TriggerBreakdownDto;
}

// Duration Response
export class DurationAnalyticsDto {
  @ApiProperty({ example: 45.5, description: 'Avg duration in minutes for GPS-completed tours' })
  avgDurationGpsCompleted: number;

  @ApiProperty({ example: 38.2, description: 'Avg duration in minutes for manually-completed tours' })
  avgDurationManualCompleted: number;

  @ApiProperty({ example: 12.8, description: 'Avg duration in minutes for abandoned tours' })
  avgDurationAbandoned: number;

  @ApiProperty({ example: 180 })
  totalGpsCompleted: number;

  @ApiProperty({ example: 50 })
  totalManualCompleted: number;

  @ApiProperty({ example: 45 })
  totalAbandoned: number;
}

// Engagement Response
export class ChannelBreakdownDto {
  @ApiProperty({ example: 'instagram' })
  channel: string;

  @ApiProperty({ example: 45 })
  clicks: number;

  @ApiProperty({ example: 24.3, description: 'Percentage of completions' })
  percentOfCompletions: number;
}

export class EngagementAnalyticsDto {
  @ApiProperty({ example: 85 })
  followUsClicks: number;

  @ApiProperty({ example: 45.9, description: 'Percentage of completions' })
  followUsPercent: number;

  @ApiProperty({ example: 120, description: 'Total clicks on contact buttons (Instagram, Facebook, Website, Email)' })
  totalContactClicks: number;

  @ApiProperty({ example: 64.8, description: 'Percentage of completions' })
  totalContactPercent: number;

  @ApiProperty({ type: [ChannelBreakdownDto] })
  channelBreakdown: ChannelBreakdownDto[];

  @ApiProperty({ example: 32 })
  donationClicks: number;

  @ApiProperty({ example: 17.3, description: 'Percentage of completions' })
  donationPercent: number;

  @ApiProperty({ example: 185 })
  totalCompletions: number;
}

// Tour Analytics Response
export class TourAnalyticsItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  tourId: string;

  @ApiProperty({ example: 'Historic Downtown Walk' })
  tourName: string;

  @ApiProperty({ example: 120 })
  starts: number;

  @ApiProperty({ example: 95 })
  completions: number;

  @ApiProperty({ example: 79.2 })
  completionRate: number;

  @ApiProperty({ example: 42.5 })
  avgDurationMinutes: number;

  @ApiProperty({ example: 85 })
  gpsTriggered: number;

  @ApiProperty({ example: 35 })
  manualTriggered: number;
}

export class TourAnalyticsListDto {
  @ApiProperty({ type: [TourAnalyticsItemDto] })
  tours: TourAnalyticsItemDto[];
}

// Session Item Response
export class SessionItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  tourId: string;

  @ApiProperty({ example: 'Historic Downtown Walk' })
  tourName: string;

  @ApiProperty({ example: '2025-05-01T10:30:00.000Z' })
  startedAt: string;

  @ApiProperty({ example: 'Samsung SM-A037G' })
  device: string;

  @ApiProperty({ example: 'Android 12' })
  osVersion: string;

  @ApiProperty({ example: 'completed', enum: ['completed', 'abandoned', 'in-progress'] })
  status: 'completed' | 'abandoned' | 'in-progress';

  @ApiProperty({ example: 42.5, nullable: true })
  durationMinutes: number | null;

  @ApiProperty({ example: 8 })
  pointsTriggered: number;

  @ApiProperty({ example: 'gps', nullable: true })
  triggerType: string | null;

  @ApiProperty({ example: 'it', nullable: true })
  language: string | null;
}

// Query params
export class AnalyticsQueryDto {
  @ApiProperty({
    enum: ['7d', '30d', '90d', 'all'],
    default: '30d',
    required: false
  })
  period?: '7d' | '30d' | '90d' | 'all';
}
