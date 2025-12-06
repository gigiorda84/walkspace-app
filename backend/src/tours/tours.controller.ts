import { Controller, Get, Param, Query, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ToursService } from './tours.service';
import { TourListItemDto, TourDetailDto, TourPointDto, ManifestDto } from './dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto';

@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Public()
  @Get()
  async listTours(@CurrentUser() user?: UserResponseDto): Promise<TourListItemDto[]> {
    return this.toursService.listTours(user?.id);
  }

  @Public()
  @Get(':id')
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
