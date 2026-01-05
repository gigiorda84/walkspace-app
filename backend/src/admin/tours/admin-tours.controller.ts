import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AdminToursService } from './admin-tours.service';
import { CreateTourDto, UpdateTourDto, AdminTourResponseDto, AdminTourListItemDto, CreateVersionDto, UpdateVersionDto, VersionResponseDto, CreatePointDto, UpdatePointDto, PointResponseDto, CreateLocalizationDto, UpdateLocalizationDto, LocalizationResponseDto } from './dto';
import { CmsJwtAuthGuard } from '../../cms-auth/guards/cms-jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('admin-tours')
@Controller('admin/tours')
@Public()
export class AdminToursController {
  constructor(private readonly adminToursService: AdminToursService) {}

  @Get()
  @ApiOperation({
    summary: '[CMS] List all tours',
    description: 'Get all tours with version and point counts. Includes both published and draft tours.'
  })
  @ApiResponse({
    status: 200,
    description: 'Tours list retrieved successfully',
    type: [AdminTourListItemDto]
  })
  async listTours(): Promise<AdminTourListItemDto[]> {
    return this.adminToursService.listTours();
  }

  @Get(':id')
  @ApiOperation({
    summary: '[CMS] Get tour by ID',
    description: 'Get complete tour details including all versions, points, and localizations.'
  })
  @ApiParam({
    name: 'id',
    description: 'Tour ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiResponse({
    status: 200,
    description: 'Tour retrieved successfully',
    type: AdminTourResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Tour not found'
  })
  async getTourById(@Param('id') id: string): Promise<AdminTourResponseDto> {
    return this.adminToursService.getTourById(id);
  }

  @Post()
  @ApiOperation({
    summary: '[CMS] Create new tour',
    description: 'Create a new tour. After creation, add versions for each language.'
  })
  @ApiResponse({
    status: 201,
    description: 'Tour created successfully',
    type: AdminTourResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error'
  })
  @ApiResponse({
    status: 409,
    description: 'Tour slug already exists'
  })
  async createTour(@Body() dto: CreateTourDto): Promise<AdminTourResponseDto> {
    return this.adminToursService.createTour(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '[CMS] Update tour',
    description: 'Update tour base properties (slug, city, duration, distance, protection status).'
  })
  @ApiParam({
    name: 'id',
    description: 'Tour ID (UUID)'
  })
  @ApiResponse({
    status: 200,
    description: 'Tour updated successfully',
    type: AdminTourResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Tour not found'
  })
  @ApiResponse({
    status: 409,
    description: 'Slug already exists'
  })
  async updateTour(
    @Param('id') id: string,
    @Body() dto: UpdateTourDto,
  ): Promise<AdminTourResponseDto> {
    return this.adminToursService.updateTour(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '[CMS] Delete tour',
    description: 'Delete tour and all related data (versions, points, localizations). This action is permanent.'
  })
  @ApiParam({
    name: 'id',
    description: 'Tour ID (UUID)'
  })
  @ApiResponse({
    status: 200,
    description: 'Tour deleted successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Tour not found'
  })
  async deleteTour(@Param('id') id: string): Promise<{ message: string }> {
    await this.adminToursService.deleteTour(id);
    return { message: 'Tour deleted successfully' };
  }

  // ==================== VERSION ENDPOINTS ====================

  @Get(':tourId/versions')
  @ApiOperation({
    summary: '[CMS] List tour versions',
    description: 'Get all language versions for a specific tour.'
  })
  @ApiParam({ name: 'tourId', description: 'Tour ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Versions retrieved successfully',
    type: [VersionResponseDto]
  })
  @ApiResponse({
    status: 404,
    description: 'Tour not found'
  })
  async getVersionsByTour(@Param('tourId') tourId: string): Promise<VersionResponseDto[]> {
    return this.adminToursService.getVersionsByTour(tourId);
  }

  @Post(':tourId/versions')
  @ApiOperation({
    summary: '[CMS] Create tour version',
    description: 'Create a new language version for a tour. Version number is auto-incremented.'
  })
  @ApiParam({ name: 'tourId', description: 'Tour ID (UUID)' })
  @ApiResponse({
    status: 201,
    description: 'Version created successfully',
    type: VersionResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Tour not found'
  })
  @ApiResponse({
    status: 409,
    description: 'Version for this language already exists'
  })
  async createVersion(
    @Param('tourId') tourId: string,
    @Body() dto: CreateVersionDto,
  ): Promise<VersionResponseDto> {
    return this.adminToursService.createVersion(tourId, dto);
  }

  @Get(':tourId/versions/:versionId')
  @ApiOperation({
    summary: '[CMS] Get version details',
    description: 'Get detailed information about a specific tour version.'
  })
  @ApiParam({ name: 'tourId', description: 'Tour ID (UUID)' })
  @ApiParam({ name: 'versionId', description: 'Version ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Version retrieved successfully',
    type: VersionResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Version not found'
  })
  async getVersion(
    @Param('tourId') tourId: string,
    @Param('versionId') versionId: string,
  ): Promise<VersionResponseDto> {
    return this.adminToursService.getVersionById(tourId, versionId);
  }

  @Patch(':tourId/versions/:versionId')
  @ApiOperation({
    summary: '[CMS] Update version',
    description: 'Update version properties (title, description, route, etc.).'
  })
  @ApiParam({ name: 'tourId', description: 'Tour ID (UUID)' })
  @ApiParam({ name: 'versionId', description: 'Version ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Version updated successfully',
    type: VersionResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Version not found'
  })
  async updateVersion(
    @Param('tourId') tourId: string,
    @Param('versionId') versionId: string,
    @Body() dto: UpdateVersionDto,
  ): Promise<VersionResponseDto> {
    return this.adminToursService.updateVersion(tourId, versionId, dto);
  }

  @Post(':tourId/versions/:versionId/publish')
  @ApiOperation({
    summary: '[CMS] Publish version',
    description: 'Change version status from draft to published. Published versions appear in mobile API.'
  })
  @ApiParam({ name: 'tourId', description: 'Tour ID (UUID)' })
  @ApiParam({ name: 'versionId', description: 'Version ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Version published successfully',
    type: VersionResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Version not found'
  })
  async publishVersion(
    @Param('tourId') tourId: string,
    @Param('versionId') versionId: string,
  ): Promise<VersionResponseDto> {
    return this.adminToursService.publishVersion(tourId, versionId);
  }

  @Post(':tourId/versions/:versionId/unpublish')
  @ApiOperation({
    summary: '[CMS] Unpublish version',
    description: 'Change version status from published to draft.'
  })
  @ApiParam({ name: 'tourId', description: 'Tour ID (UUID)' })
  @ApiParam({ name: 'versionId', description: 'Version ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Version unpublished successfully',
    type: VersionResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Version not found'
  })
  async unpublishVersion(
    @Param('tourId') tourId: string,
    @Param('versionId') versionId: string,
  ): Promise<VersionResponseDto> {
    return this.adminToursService.unpublishVersion(tourId, versionId);
  }

  @Delete(':tourId/versions/:versionId')
  @ApiOperation({
    summary: '[CMS] Delete version',
    description: 'Delete a tour version and all related points and localizations.'
  })
  @ApiParam({ name: 'tourId', description: 'Tour ID (UUID)' })
  @ApiParam({ name: 'versionId', description: 'Version ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Version deleted successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Version not found'
  })
  async deleteVersion(
    @Param('tourId') tourId: string,
    @Param('versionId') versionId: string,
  ): Promise<{ message: string }> {
    await this.adminToursService.deleteVersion(tourId, versionId);
    return { message: 'Version deleted successfully' };
  }

  // ==================== POINTS ENDPOINTS ====================

  @Get(':tourId/points')
  @ApiOperation({
    summary: '[CMS] List tour points',
    description: 'Get all GPS waypoints for a specific tour, ordered by sequence.'
  })
  @ApiParam({ name: 'tourId', description: 'Tour ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Points retrieved successfully',
    type: [PointResponseDto]
  })
  @ApiResponse({
    status: 404,
    description: 'Tour not found'
  })
  async getPointsByTour(@Param('tourId') tourId: string): Promise<PointResponseDto[]> {
    return this.adminToursService.getPointsByTour(tourId);
  }

  @Post(':tourId/points')
  @ApiOperation({
    summary: '[CMS] Create tour point',
    description: 'Add a GPS waypoint to the tour route. Points must have unique order numbers.'
  })
  @ApiParam({ name: 'tourId', description: 'Tour ID (UUID)' })
  @ApiResponse({
    status: 201,
    description: 'Point created successfully',
    type: PointResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Tour not found'
  })
  @ApiResponse({
    status: 409,
    description: 'Point with this order already exists'
  })
  async createPoint(
    @Param('tourId') tourId: string,
    @Body() dto: CreatePointDto,
  ): Promise<PointResponseDto> {
    return this.adminToursService.createPoint(tourId, dto);
  }

  @Get(':tourId/points/:pointId')
  @ApiOperation({
    summary: '[CMS] Get point details',
    description: 'Get GPS point with all localizations.'
  })
  @ApiParam({ name: 'tourId', description: 'Tour ID (UUID)' })
  @ApiParam({ name: 'pointId', description: 'Point ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Point retrieved successfully',
    type: PointResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Point not found'
  })
  async getPoint(
    @Param('tourId') tourId: string,
    @Param('pointId') pointId: string,
  ): Promise<PointResponseDto> {
    return this.adminToursService.getPointById(tourId, pointId);
  }

  @Patch(':tourId/points/:pointId')
  @ApiOperation({
    summary: '[CMS] Update point',
    description: 'Update point GPS coordinates, order, or trigger radius.'
  })
  @ApiParam({ name: 'tourId', description: 'Tour ID (UUID)' })
  @ApiParam({ name: 'pointId', description: 'Point ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Point updated successfully',
    type: PointResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Point not found'
  })
  async updatePoint(
    @Param('tourId') tourId: string,
    @Param('pointId') pointId: string,
    @Body() dto: UpdatePointDto,
  ): Promise<PointResponseDto> {
    return this.adminToursService.updatePoint(tourId, pointId, dto);
  }

  @Delete(':tourId/points/:pointId')
  @ApiOperation({
    summary: '[CMS] Delete point',
    description: 'Delete GPS point and all its localizations.'
  })
  @ApiParam({ name: 'tourId', description: 'Tour ID (UUID)' })
  @ApiParam({ name: 'pointId', description: 'Point ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Point deleted successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Point not found'
  })
  async deletePoint(
    @Param('tourId') tourId: string,
    @Param('pointId') pointId: string,
  ): Promise<{ message: string }> {
    await this.adminToursService.deletePoint(tourId, pointId);
    return { message: 'Point deleted successfully' };
  }

  @Post(':tourId/points/reorder')
  @ApiOperation({
    summary: '[CMS] Reorder tour points',
    description: 'Update the sequence order of tour points. Provide array of point IDs in desired order.'
  })
  @ApiParam({ name: 'tourId', description: 'Tour ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Points reordered successfully',
    type: [PointResponseDto]
  })
  @ApiResponse({
    status: 404,
    description: 'Tour not found'
  })
  async reorderPoints(
    @Param('tourId') tourId: string,
    @Body() body: { pointIds: string[] },
  ): Promise<PointResponseDto[]> {
    return this.adminToursService.reorderPoints(tourId, body.pointIds);
  }

  // ==================== LOCALIZATION ENDPOINTS ====================

  @Get(':tourId/points/:pointId/localizations')
  @ApiOperation({
    summary: '[CMS] Get point localizations',
    description: 'Get all localizations for a specific point across all languages.'
  })
  @ApiParam({ name: 'tourId', description: 'Tour ID (UUID)' })
  @ApiParam({ name: 'pointId', description: 'Point ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Localizations retrieved successfully',
    type: [LocalizationResponseDto]
  })
  @ApiResponse({
    status: 404,
    description: 'Point not found'
  })
  async getLocalizationsByPoint(
    @Param('tourId') tourId: string,
    @Param('pointId') pointId: string,
  ): Promise<LocalizationResponseDto[]> {
    return this.adminToursService.getLocalizationsByPoint(tourId, pointId);
  }

  @Post(':tourId/points/:pointId/localizations')
  @ApiOperation({
    summary: '[CMS] Create point localization',
    description: 'Add language-specific content for a GPS point (audio, text, images). Auto-links to matching version.'
  })
  @ApiParam({ name: 'tourId', description: 'Tour ID (UUID)' })
  @ApiParam({ name: 'pointId', description: 'Point ID (UUID)' })
  @ApiResponse({
    status: 201,
    description: 'Localization created successfully',
    type: LocalizationResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Point or matching version not found'
  })
  async createLocalization(
    @Param('tourId') tourId: string,
    @Param('pointId') pointId: string,
    @Body() dto: CreateLocalizationDto,
  ): Promise<LocalizationResponseDto> {
    return this.adminToursService.createLocalization(tourId, pointId, dto);
  }

  @Patch(':tourId/points/:pointId/localizations/:localizationId')
  @ApiOperation({
    summary: '[CMS] Update localization',
    description: 'Update point content for a specific language.'
  })
  @ApiParam({ name: 'tourId', description: 'Tour ID (UUID)' })
  @ApiParam({ name: 'pointId', description: 'Point ID (UUID)' })
  @ApiParam({ name: 'localizationId', description: 'Localization ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Localization updated successfully',
    type: LocalizationResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Localization not found'
  })
  async updateLocalization(
    @Param('tourId') tourId: string,
    @Param('pointId') pointId: string,
    @Param('localizationId') localizationId: string,
    @Body() dto: UpdateLocalizationDto,
  ): Promise<LocalizationResponseDto> {
    return this.adminToursService.updateLocalization(tourId, pointId, localizationId, dto);
  }

  @Delete(':tourId/points/:pointId/localizations/:localizationId')
  @ApiOperation({
    summary: '[CMS] Delete localization',
    description: 'Delete language-specific content for a point.'
  })
  @ApiParam({ name: 'tourId', description: 'Tour ID (UUID)' })
  @ApiParam({ name: 'pointId', description: 'Point ID (UUID)' })
  @ApiParam({ name: 'localizationId', description: 'Localization ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Localization deleted successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Localization not found'
  })
  async deleteLocalization(
    @Param('tourId') tourId: string,
    @Param('pointId') pointId: string,
    @Param('localizationId') localizationId: string,
  ): Promise<{ message: string }> {
    await this.adminToursService.deleteLocalization(tourId, pointId, localizationId);
    return { message: 'Localization deleted successfully' };
  }
}
