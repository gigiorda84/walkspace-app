import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit feedback or newsletter signup' })
  @ApiResponse({ status: 201, description: 'Submission created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async create(@Body() dto: CreateFeedbackDto) {
    await this.feedbackService.create(dto);
    return { success: true, message: 'Thank you for your submission!' };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all feedback submissions (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.feedbackService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }
}
