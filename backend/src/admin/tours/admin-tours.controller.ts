import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AdminToursService } from './admin-tours.service';
import { CreateTourDto, UpdateTourDto, AdminTourResponseDto, AdminTourListItemDto, CreateVersionDto, UpdateVersionDto, VersionResponseDto, CreatePointDto, UpdatePointDto, PointResponseDto, CreateLocalizationDto, UpdateLocalizationDto, LocalizationResponseDto } from './dto';
import { CmsJwtAuthGuard } from '../../cms-auth/guards/cms-jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('admin/tours')
@Public()
export class AdminToursController {
  constructor(private readonly adminToursService: AdminToursService) {}

  @Get()
  async listTours(): Promise<AdminTourListItemDto[]> {
    return this.adminToursService.listTours();
  }

  @Get(':id')
  async getTourById(@Param('id') id: string): Promise<AdminTourResponseDto> {
    return this.adminToursService.getTourById(id);
  }

  @Post()
  async createTour(@Body() dto: CreateTourDto): Promise<AdminTourResponseDto> {
    return this.adminToursService.createTour(dto);
  }

  @Patch(':id')
  async updateTour(
    @Param('id') id: string,
    @Body() dto: UpdateTourDto,
  ): Promise<AdminTourResponseDto> {
    return this.adminToursService.updateTour(id, dto);
  }

  @Delete(':id')
  async deleteTour(@Param('id') id: string): Promise<{ message: string }> {
    await this.adminToursService.deleteTour(id);
    return { message: 'Tour deleted successfully' };
  }

  // ==================== VERSION ENDPOINTS ====================

  @Post(':tourId/versions')
  async createVersion(
    @Param('tourId') tourId: string,
    @Body() dto: CreateVersionDto,
  ): Promise<VersionResponseDto> {
    return this.adminToursService.createVersion(tourId, dto);
  }

  @Get(':tourId/versions/:versionId')
  async getVersion(
    @Param('tourId') tourId: string,
    @Param('versionId') versionId: string,
  ): Promise<VersionResponseDto> {
    return this.adminToursService.getVersionById(tourId, versionId);
  }

  @Patch(':tourId/versions/:versionId')
  async updateVersion(
    @Param('tourId') tourId: string,
    @Param('versionId') versionId: string,
    @Body() dto: UpdateVersionDto,
  ): Promise<VersionResponseDto> {
    return this.adminToursService.updateVersion(tourId, versionId, dto);
  }

  @Post(':tourId/versions/:versionId/publish')
  async publishVersion(
    @Param('tourId') tourId: string,
    @Param('versionId') versionId: string,
  ): Promise<VersionResponseDto> {
    return this.adminToursService.publishVersion(tourId, versionId);
  }

  @Delete(':tourId/versions/:versionId')
  async deleteVersion(
    @Param('tourId') tourId: string,
    @Param('versionId') versionId: string,
  ): Promise<{ message: string }> {
    await this.adminToursService.deleteVersion(tourId, versionId);
    return { message: 'Version deleted successfully' };
  }

  // ==================== POINTS ENDPOINTS ====================

  @Post(':tourId/points')
  async createPoint(
    @Param('tourId') tourId: string,
    @Body() dto: CreatePointDto,
  ): Promise<PointResponseDto> {
    return this.adminToursService.createPoint(tourId, dto);
  }

  @Get(':tourId/points/:pointId')
  async getPoint(
    @Param('tourId') tourId: string,
    @Param('pointId') pointId: string,
  ): Promise<PointResponseDto> {
    return this.adminToursService.getPointById(tourId, pointId);
  }

  @Patch(':tourId/points/:pointId')
  async updatePoint(
    @Param('tourId') tourId: string,
    @Param('pointId') pointId: string,
    @Body() dto: UpdatePointDto,
  ): Promise<PointResponseDto> {
    return this.adminToursService.updatePoint(tourId, pointId, dto);
  }

  @Delete(':tourId/points/:pointId')
  async deletePoint(
    @Param('tourId') tourId: string,
    @Param('pointId') pointId: string,
  ): Promise<{ message: string }> {
    await this.adminToursService.deletePoint(tourId, pointId);
    return { message: 'Point deleted successfully' };
  }

  // ==================== LOCALIZATION ENDPOINTS ====================

  @Post(':tourId/points/:pointId/localizations')
  async createLocalization(
    @Param('tourId') tourId: string,
    @Param('pointId') pointId: string,
    @Body() dto: CreateLocalizationDto,
  ): Promise<LocalizationResponseDto> {
    return this.adminToursService.createLocalization(tourId, pointId, dto);
  }

  @Patch(':tourId/points/:pointId/localizations/:localizationId')
  async updateLocalization(
    @Param('tourId') tourId: string,
    @Param('pointId') pointId: string,
    @Param('localizationId') localizationId: string,
    @Body() dto: UpdateLocalizationDto,
  ): Promise<LocalizationResponseDto> {
    return this.adminToursService.updateLocalization(tourId, pointId, localizationId, dto);
  }

  @Delete(':tourId/points/:pointId/localizations/:localizationId')
  async deleteLocalization(
    @Param('tourId') tourId: string,
    @Param('pointId') pointId: string,
    @Param('localizationId') localizationId: string,
  ): Promise<{ message: string }> {
    await this.adminToursService.deleteLocalization(tourId, pointId, localizationId);
    return { message: 'Localization deleted successfully' };
  }
}
