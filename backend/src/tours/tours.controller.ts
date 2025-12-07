import { Controller, Get, Param, Query, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ToursService } from './tours.service';
import { TourListItemDto, TourDetailDto, TourPointDto, ManifestDto } from './dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto';

@ApiTags('tours')
@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List all published tours',
    description: 'Get list of all published tours. Returns basic tour information including access status for authenticated users.'
  })
  @ApiResponse({
    status: 200,
    description: 'List of tours retrieved successfully',
    type: [TourListItemDto]
  })
  async listTours(@CurrentUser() user?: UserResponseDto): Promise<TourListItemDto[]> {
    return this.toursService.listTours(user?.id);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get tour details',
    description: 'Get detailed information about a specific tour in a given language.'
  })
  @ApiParam({
    name: 'id',
    description: 'Tour ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiQuery({
    name: 'language',
    description: 'Language code (it, fr, en)',
    example: 'en',
    enum: ['it', 'fr', 'en']
  })
  @ApiResponse({
    status: 200,
    description: 'Tour details retrieved successfully',
    type: TourDetailDto
  })
  @ApiResponse({
    status: 404,
    description: 'Tour not found or language version does not exist'
  })
  async getTourDetails(
    @Param('id') id: string,
    @Query('language') language: string,
    @CurrentUser() user?: UserResponseDto,
  ): Promise<TourDetailDto> {
    if (!language) {
      throw new NotFoundException('Language query parameter is required');
    }
    return this.toursService.getTourDetails(id, language, user?.id);
  }

  @Public()
  @Get(':id/manifest')
  @ApiOperation({
    summary: 'Get tour download manifest',
    description: 'Get complete tour package manifest with signed URLs for offline download (audio, images, subtitles, map tiles).'
  })
  @ApiParam({
    name: 'id',
    description: 'Tour ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiQuery({
    name: 'language',
    description: 'Language code (it, fr, en)',
    example: 'en',
    enum: ['it', 'fr', 'en']
  })
  @ApiResponse({
    status: 200,
    description: 'Manifest generated successfully',
    type: ManifestDto
  })
  @ApiResponse({
    status: 403,
    description: 'Tour is protected and requires voucher redemption'
  })
  @ApiResponse({
    status: 404,
    description: 'Tour not found or language version does not exist'
  })
  async getTourManifest(
    @Param('id') id: string,
    @Query('language') language: string,
    @CurrentUser() user?: UserResponseDto,
  ): Promise<ManifestDto> {
    if (!language) {
      throw new NotFoundException('Language query parameter is required');
    }
    return this.toursService.getTourManifest(id, language, user?.id);
  }

  @Public()
  @Get(':id/points')
  @ApiOperation({
    summary: 'Get tour GPS points',
    description: 'Get all GPS waypoints with localized content for sequential audio triggering.'
  })
  @ApiParam({
    name: 'id',
    description: 'Tour ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiQuery({
    name: 'language',
    description: 'Language code (it, fr, en)',
    example: 'en',
    enum: ['it', 'fr', 'en']
  })
  @ApiResponse({
    status: 200,
    description: 'Tour points retrieved successfully',
    type: [TourPointDto]
  })
  @ApiResponse({
    status: 403,
    description: 'Tour is protected and requires voucher redemption'
  })
  @ApiResponse({
    status: 404,
    description: 'Tour not found or language version does not exist'
  })
  async getTourPoints(
    @Param('id') id: string,
    @Query('language') language: string,
    @CurrentUser() user?: UserResponseDto,
  ): Promise<TourPointDto[]> {
    if (!language) {
      throw new NotFoundException('Language query parameter is required');
    }
    return this.toursService.getTourPoints(id, language, user?.id);
  }
}
