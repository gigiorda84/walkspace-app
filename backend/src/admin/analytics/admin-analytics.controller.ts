import { Controller, Get, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AdminAnalyticsService } from './admin-analytics.service';
import {
  AnalyticsOverviewDto,
  DurationAnalyticsDto,
  EngagementAnalyticsDto,
  TourAnalyticsItemDto,
  SessionItemDto,
} from './dto';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('admin-analytics')
@Controller('admin/analytics')
@Public()
export class AdminAnalyticsController {
  constructor(private readonly adminAnalyticsService: AdminAnalyticsService) {}

  @Get('overview')
  @ApiOperation({
    summary: '[CMS] Get analytics overview',
    description: 'Get summary statistics: total starts, completions, unique devices, platform and trigger breakdown.',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['7d', '30d', '90d', 'all'],
    description: 'Time period filter',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics overview retrieved successfully',
    type: AnalyticsOverviewDto,
  })
  async getOverview(@Query('period') period?: string): Promise<AnalyticsOverviewDto> {
    return this.adminAnalyticsService.getOverview(period || '30d');
  }

  @Get('duration')
  @ApiOperation({
    summary: '[CMS] Get duration analytics',
    description: 'Get average tour duration breakdown by completion status and trigger type.',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['7d', '30d', '90d', 'all'],
    description: 'Time period filter',
  })
  @ApiResponse({
    status: 200,
    description: 'Duration analytics retrieved successfully',
    type: DurationAnalyticsDto,
  })
  async getDuration(@Query('period') period?: string): Promise<DurationAnalyticsDto> {
    return this.adminAnalyticsService.getDurationAnalytics(period || '30d');
  }

  @Get('engagement')
  @ApiOperation({
    summary: '[CMS] Get engagement analytics',
    description: 'Get post-tour engagement stats: follow us clicks, contact channel breakdown, donation clicks.',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['7d', '30d', '90d', 'all'],
    description: 'Time period filter',
  })
  @ApiResponse({
    status: 200,
    description: 'Engagement analytics retrieved successfully',
    type: EngagementAnalyticsDto,
  })
  async getEngagement(@Query('period') period?: string): Promise<EngagementAnalyticsDto> {
    return this.adminAnalyticsService.getEngagementAnalytics(period || '30d');
  }

  @Get('tours')
  @ApiOperation({
    summary: '[CMS] Get per-tour analytics',
    description: 'Get analytics breakdown for each tour: starts, completions, avg duration, trigger types.',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['7d', '30d', '90d', 'all'],
    description: 'Time period filter',
  })
  @ApiResponse({
    status: 200,
    description: 'Tour analytics retrieved successfully',
    type: [TourAnalyticsItemDto],
  })
  async getTours(@Query('period') period?: string): Promise<TourAnalyticsItemDto[]> {
    return this.adminAnalyticsService.getTourAnalytics(period || '30d');
  }

  @Get('sessions')
  @ApiOperation({
    summary: '[CMS] Get recent tour sessions',
    description: 'Get list of recent individual tour sessions with status, duration, and points triggered.',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['7d', '30d', '90d', 'all'],
    description: 'Time period filter',
  })
  @ApiResponse({
    status: 200,
    description: 'Sessions retrieved successfully',
    type: [SessionItemDto],
  })
  async getSessions(@Query('period') period?: string): Promise<SessionItemDto[]> {
    return this.adminAnalyticsService.getSessions(period || '30d');
  }

  @Delete()
  @ApiOperation({
    summary: '[CMS] Delete all analytics data',
    description: 'Permanently delete all analytics events. This action cannot be undone.',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics data deleted successfully',
  })
  async deleteAll(): Promise<{ deleted: number }> {
    return this.adminAnalyticsService.deleteAllAnalytics();
  }
}
