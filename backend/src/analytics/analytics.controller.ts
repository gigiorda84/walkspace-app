import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TrackEventsDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Post('events')
  @HttpCode(HttpStatus.NO_CONTENT)
  async trackEvents(
    @Body() dto: TrackEventsDto,
    @CurrentUser() user?: UserResponseDto,
  ): Promise<void> {
    await this.analyticsService.trackEvents(dto.events, user?.id);
  }
}
