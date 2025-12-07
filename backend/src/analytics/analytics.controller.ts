import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { TrackEventsDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Post('events')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Track analytics events',
    description: 'Batch upload analytics events (tour views, downloads, GPS triggers, completions). ' +
      'Events are stored with flexible JSONB properties for future analysis. ' +
      'Authentication is optional - anonymous tracking is supported.'
  })
  @ApiResponse({
    status: 204,
    description: 'Events successfully recorded (no content returned)'
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error in event data'
  })
  async trackEvents(
    @Body() dto: TrackEventsDto,
    @CurrentUser() user?: UserResponseDto,
  ): Promise<void> {
    await this.analyticsService.trackEvents(dto.events, user?.id);
  }
}
