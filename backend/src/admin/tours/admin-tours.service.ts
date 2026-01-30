import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateTourDto, UpdateTourDto, AdminTourResponseDto, AdminTourListItemDto, CreateVersionDto, UpdateVersionDto, VersionResponseDto, CreatePointDto, UpdatePointDto, PointResponseDto, CreateLocalizationDto, UpdateLocalizationDto, LocalizationResponseDto } from './dto';

@Injectable()
export class AdminToursService {
  constructor(private readonly prisma: PrismaService) {}

  async listTours(): Promise<AdminTourListItemDto[]> {
    const tours = await this.prisma.tour.findMany({
      include: {
        versions: {
          select: {
            id: true,
            status: true,
            language: true,
          },
        },
        points: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tours.map((tour) => ({
      id: tour.id,
      slug: tour.slug,
      defaultCity: tour.defaultCity,
      defaultDurationMinutes: tour.defaultDurationMinutes,
      defaultDistanceKm: tour.defaultDistanceKm,
      defaultDifficulty: tour.defaultDifficulty,
      isProtected: tour.isProtected,
      createdAt: tour.createdAt,
      updatedAt: tour.updatedAt,
      versionsCount: tour.versions.length,
      publishedVersionsCount: tour.versions.filter((v) => v.status === 'published').length,
      pointsCount: tour.points.length,
      languages: [...new Set(tour.versions.map((v) => v.language))],
    }));
  }

  async getTourById(id: string): Promise<AdminTourResponseDto> {
    const tour = await this.prisma.tour.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        points: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!tour) {
      throw new NotFoundException('Tour not found');
    }

    return {
      id: tour.id,
      slug: tour.slug,
      defaultCity: tour.defaultCity,
      defaultDurationMinutes: tour.defaultDurationMinutes,
      defaultDistanceKm: tour.defaultDistanceKm,
      defaultDifficulty: tour.defaultDifficulty,
      isProtected: tour.isProtected,
      coverImageFileId: tour.coverImageFileId,
      videoFileId: tour.videoFileId,
      routePolyline: tour.routePolyline,
      createdAt: tour.createdAt,
      updatedAt: tour.updatedAt,
      versions: tour.versions,
      pointsCount: tour.points.length,
    };
  }

  async createTour(dto: CreateTourDto): Promise<AdminTourResponseDto> {
    // Check if slug already exists
    const existing = await this.prisma.tour.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Tour with this slug already exists');
    }

    // Validate media file IDs if provided
    if (dto.coverImageFileId) {
      const coverImage = await this.prisma.mediaFile.findUnique({
        where: { id: dto.coverImageFileId },
      });
      if (!coverImage) {
        throw new NotFoundException('Cover image file not found');
      }
    }

    if (dto.videoFileId) {
      const video = await this.prisma.mediaFile.findUnique({
        where: { id: dto.videoFileId },
      });
      if (!video) {
        throw new NotFoundException('Video file not found');
      }
    }

    const tour = await this.prisma.tour.create({
      data: {
        slug: dto.slug,
        defaultCity: dto.defaultCity,
        defaultDurationMinutes: dto.defaultDurationMinutes,
        defaultDistanceKm: dto.defaultDistanceKm,
        defaultDifficulty: dto.defaultDifficulty ?? 'facile',
        isProtected: dto.isProtected ?? false,
        coverImageFileId: dto.coverImageFileId,
        videoFileId: dto.videoFileId,
      },
      include: {
        versions: true,
        points: {
          select: {
            id: true,
          },
        },
      },
    });

    return {
      id: tour.id,
      slug: tour.slug,
      defaultCity: tour.defaultCity,
      defaultDurationMinutes: tour.defaultDurationMinutes,
      defaultDistanceKm: tour.defaultDistanceKm,
      defaultDifficulty: tour.defaultDifficulty,
      isProtected: tour.isProtected,
      coverImageFileId: tour.coverImageFileId,
      videoFileId: tour.videoFileId,
      routePolyline: tour.routePolyline,
      createdAt: tour.createdAt,
      updatedAt: tour.updatedAt,
      versions: tour.versions,
      pointsCount: tour.points.length,
    };
  }

  async updateTour(id: string, dto: UpdateTourDto): Promise<AdminTourResponseDto> {
    // Check if tour exists
    const existing = await this.prisma.tour.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Tour not found');
    }

    // Check if new slug conflicts with another tour
    if (dto.slug && dto.slug !== existing.slug) {
      const conflicting = await this.prisma.tour.findUnique({
        where: { slug: dto.slug },
      });
      if (conflicting) {
        throw new ConflictException('Tour with this slug already exists');
      }
    }

    // Validate media file IDs if provided
    if (dto.coverImageFileId) {
      const coverImage = await this.prisma.mediaFile.findUnique({
        where: { id: dto.coverImageFileId },
      });
      if (!coverImage) {
        throw new NotFoundException('Cover image file not found');
      }
    }

    if (dto.videoFileId) {
      const video = await this.prisma.mediaFile.findUnique({
        where: { id: dto.videoFileId },
      });
      if (!video) {
        throw new NotFoundException('Video file not found');
      }
    }

    const tour = await this.prisma.tour.update({
      where: { id },
      data: dto,
      include: {
        versions: true,
        points: {
          select: {
            id: true,
          },
        },
      },
    });

    return {
      id: tour.id,
      slug: tour.slug,
      defaultCity: tour.defaultCity,
      defaultDurationMinutes: tour.defaultDurationMinutes,
      defaultDistanceKm: tour.defaultDistanceKm,
      defaultDifficulty: tour.defaultDifficulty,
      isProtected: tour.isProtected,
      coverImageFileId: tour.coverImageFileId,
      videoFileId: tour.videoFileId,
      routePolyline: tour.routePolyline,
      createdAt: tour.createdAt,
      updatedAt: tour.updatedAt,
      versions: tour.versions,
      pointsCount: tour.points.length,
    };
  }

  async deleteTour(id: string): Promise<void> {
    const tour = await this.prisma.tour.findUnique({
      where: { id },
      include: {
        versions: true,
        points: true,
        userAccess: true,
      },
    });

    if (!tour) {
      throw new NotFoundException('Tour not found');
    }

    // Delete all related data in a transaction
    await this.prisma.$transaction(async (prisma) => {
      // Delete point localizations first
      for (const point of tour.points) {
        await prisma.tourPointLocalization.deleteMany({
          where: { tourPointId: point.id },
        });
      }

      // Delete points
      await prisma.tourPoint.deleteMany({
        where: { tourId: id },
      });

      // Delete user access records
      await prisma.userTourAccess.deleteMany({
        where: { tourId: id },
      });

      // Delete versions
      await prisma.tourVersion.deleteMany({
        where: { tourId: id },
      });

      // Finally delete the tour
      await prisma.tour.delete({
        where: { id },
      });
    });
  }

  // ==================== VERSION MANAGEMENT ====================

  async getVersionsByTour(tourId: string): Promise<VersionResponseDto[]> {
    // Verify tour exists
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      throw new NotFoundException('Tour not found');
    }

    const versions = await this.prisma.tourVersion.findMany({
      where: { tourId },
      orderBy: { createdAt: 'desc' },
    });

    return versions.map(v => ({
      ...v,
      status: v.status as 'published' | 'draft',
    }));
  }

  async createVersion(tourId: string, dto: CreateVersionDto): Promise<VersionResponseDto> {
    // Verify tour exists
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      throw new NotFoundException('Tour not found');
    }

    // Check if version for this language already exists
    const existingVersion = await this.prisma.tourVersion.findFirst({
      where: {
        tourId,
        language: dto.language,
      },
    });

    if (existingVersion) {
      throw new ConflictException(`Version for language '${dto.language}' already exists`);
    }

    // Get the next version number for this tour
    const maxVersion = await this.prisma.tourVersion.findFirst({
      where: { tourId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    const versionNumber = maxVersion ? maxVersion.versionNumber + 1 : 1;

    const version = await this.prisma.tourVersion.create({
      data: {
        tourId,
        language: dto.language,
        title: dto.title,
        description: dto.description,
        completionMessage: dto.completionMessage,
        coverImageFileId: dto.coverImageFileId,
        coverTrailerFileId: dto.coverTrailerFileId,
        startingPointLat: dto.startingPointLat,
        startingPointLng: dto.startingPointLng,
        status: dto.status || 'draft',
        versionNumber,
      },
    });

    return {
      ...version,
      status: version.status as 'draft' | 'published',
    };
  }

  async getVersionById(tourId: string, versionId: string): Promise<VersionResponseDto> {
    const version = await this.prisma.tourVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    if (version.tourId !== tourId) {
      throw new BadRequestException('Version does not belong to this tour');
    }

    return {
      ...version,
      status: version.status as 'draft' | 'published',
    };
  }

  async updateVersion(tourId: string, versionId: string, dto: UpdateVersionDto): Promise<VersionResponseDto> {
    // Verify version exists and belongs to tour
    const existing = await this.prisma.tourVersion.findUnique({
      where: { id: versionId },
    });

    if (!existing) {
      throw new NotFoundException('Version not found');
    }

    if (existing.tourId !== tourId) {
      throw new BadRequestException('Version does not belong to this tour');
    }

    const version = await this.prisma.tourVersion.update({
      where: { id: versionId },
      data: dto,
    });

    return {
      ...version,
      status: version.status as 'draft' | 'published',
    };
  }

  async publishVersion(tourId: string, versionId: string): Promise<VersionResponseDto> {
    // Verify version exists and belongs to tour
    const existing = await this.prisma.tourVersion.findUnique({
      where: { id: versionId },
    });

    if (!existing) {
      throw new NotFoundException('Version not found');
    }

    if (existing.tourId !== tourId) {
      throw new BadRequestException('Version does not belong to this tour');
    }

    // Use a transaction to ensure only one published version per language
    const version = await this.prisma.$transaction(async (tx) => {
      // First, unpublish any other versions with the same language
      await tx.tourVersion.updateMany({
        where: {
          tourId,
          language: existing.language,
          id: { not: versionId },
          status: 'published',
        },
        data: { status: 'draft' },
      });

      // Then publish the target version
      return tx.tourVersion.update({
        where: { id: versionId },
        data: { status: 'published' },
      });
    });

    return {
      ...version,
      status: 'published' as const,
    };
  }

  async unpublishVersion(tourId: string, versionId: string): Promise<VersionResponseDto> {
    // Verify version exists and belongs to tour
    const existing = await this.prisma.tourVersion.findUnique({
      where: { id: versionId },
    });

    if (!existing) {
      throw new NotFoundException('Version not found');
    }

    if (existing.tourId !== tourId) {
      throw new BadRequestException('Version does not belong to this tour');
    }

    const version = await this.prisma.tourVersion.update({
      where: { id: versionId },
      data: { status: 'draft' },
    });

    return {
      ...version,
      status: 'draft' as const,
    };
  }

  async deleteVersion(tourId: string, versionId: string): Promise<void> {
    // Verify version exists and belongs to tour
    const version = await this.prisma.tourVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    if (version.tourId !== tourId) {
      throw new BadRequestException('Version does not belong to this tour');
    }

    // Delete in transaction
    await this.prisma.$transaction(async (prisma) => {
      // Delete all point localizations for this version
      await prisma.tourPointLocalization.deleteMany({
        where: { tourVersionId: versionId },
      });

      // Delete the version
      await prisma.tourVersion.delete({
        where: { id: versionId },
      });
    });
  }

  // ==================== POINTS MANAGEMENT ====================

  async getPointsByTour(tourId: string): Promise<PointResponseDto[]> {
    // Verify tour exists
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      throw new NotFoundException('Tour not found');
    }

    const points = await this.prisma.tourPoint.findMany({
      where: { tourId },
      include: {
        localizations: true,
      },
      orderBy: { order: 'asc' },
    });

    return points.map(p => ({
      ...p,
      sequenceOrder: p.order,
      latitude: p.lat,
      longitude: p.lng,
      triggerRadiusMeters: p.defaultTriggerRadiusMeters,
    }));
  }

  async createPoint(tourId: string, dto: CreatePointDto): Promise<PointResponseDto> {
    // Verify tour exists
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      throw new NotFoundException('Tour not found');
    }

    // Check if order already exists
    const existingPoint = await this.prisma.tourPoint.findFirst({
      where: {
        tourId,
        order: dto.order,
      },
    });

    if (existingPoint) {
      throw new ConflictException(`Point with order ${dto.order} already exists for this tour`);
    }

    const point = await this.prisma.tourPoint.create({
      data: {
        tourId,
        order: dto.order,
        lat: dto.lat,
        lng: dto.lng,
        defaultTriggerRadiusMeters: dto.defaultTriggerRadiusMeters ?? 150,
      },
      include: {
        localizations: true,
      },
    });

    return {
      id: point.id,
      tourId: point.tourId,
      order: point.order,
      lat: point.lat,
      lng: point.lng,
      defaultTriggerRadiusMeters: point.defaultTriggerRadiusMeters,
      createdAt: point.createdAt,
      updatedAt: point.updatedAt,
      localizations: point.localizations.map((loc) => ({
        id: loc.id,
        tourPointId: loc.tourPointId,
        tourVersionId: loc.tourVersionId,
        language: loc.language,
        title: loc.title,
        description: loc.description,
        audioFileId: loc.audioFileId,
        imageFileId: loc.imageFileId,
        subtitleFileId: loc.subtitleFileId,
      })),
    };
  }

  async getPointById(tourId: string, pointId: string): Promise<PointResponseDto> {
    const point = await this.prisma.tourPoint.findUnique({
      where: { id: pointId },
      include: {
        localizations: true,
      },
    });

    if (!point) {
      throw new NotFoundException('Point not found');
    }

    if (point.tourId !== tourId) {
      throw new BadRequestException('Point does not belong to this tour');
    }

    return {
      id: point.id,
      tourId: point.tourId,
      order: point.order,
      lat: point.lat,
      lng: point.lng,
      defaultTriggerRadiusMeters: point.defaultTriggerRadiusMeters,
      // Add CMS-friendly field mappings
      sequenceOrder: point.order,
      latitude: point.lat,
      longitude: point.lng,
      triggerRadiusMeters: point.defaultTriggerRadiusMeters,
      createdAt: point.createdAt,
      updatedAt: point.updatedAt,
      localizations: point.localizations.map((loc) => ({
        id: loc.id,
        tourPointId: loc.tourPointId,
        tourVersionId: loc.tourVersionId,
        language: loc.language,
        title: loc.title,
        description: loc.description,
        audioFileId: loc.audioFileId,
        imageFileId: loc.imageFileId,
        subtitleFileId: loc.subtitleFileId,
      })),
    };
  }

  async updatePoint(tourId: string, pointId: string, dto: UpdatePointDto): Promise<PointResponseDto> {
    // Verify point exists and belongs to tour
    const existing = await this.prisma.tourPoint.findUnique({
      where: { id: pointId },
    });

    if (!existing) {
      throw new NotFoundException('Point not found');
    }

    if (existing.tourId !== tourId) {
      throw new BadRequestException('Point does not belong to this tour');
    }

    // If order is being changed, check for conflicts
    if (dto.order !== undefined && dto.order !== existing.order) {
      const conflicting = await this.prisma.tourPoint.findFirst({
        where: {
          tourId,
          order: dto.order,
          id: { not: pointId },
        },
      });

      if (conflicting) {
        throw new ConflictException(`Point with order ${dto.order} already exists for this tour`);
      }
    }

    const point = await this.prisma.tourPoint.update({
      where: { id: pointId },
      data: dto,
      include: {
        localizations: true,
      },
    });

    return {
      id: point.id,
      tourId: point.tourId,
      order: point.order,
      lat: point.lat,
      lng: point.lng,
      defaultTriggerRadiusMeters: point.defaultTriggerRadiusMeters,
      createdAt: point.createdAt,
      updatedAt: point.updatedAt,
      localizations: point.localizations.map((loc) => ({
        id: loc.id,
        tourPointId: loc.tourPointId,
        tourVersionId: loc.tourVersionId,
        language: loc.language,
        title: loc.title,
        description: loc.description,
        audioFileId: loc.audioFileId,
        imageFileId: loc.imageFileId,
        subtitleFileId: loc.subtitleFileId,
      })),
    };
  }

  async deletePoint(tourId: string, pointId: string): Promise<void> {
    // Verify point exists and belongs to tour
    const point = await this.prisma.tourPoint.findUnique({
      where: { id: pointId },
    });

    if (!point) {
      throw new NotFoundException('Point not found');
    }

    if (point.tourId !== tourId) {
      throw new BadRequestException('Point does not belong to this tour');
    }

    // Delete in transaction
    await this.prisma.$transaction(async (prisma) => {
      // Delete all localizations for this point
      await prisma.tourPointLocalization.deleteMany({
        where: { tourPointId: pointId },
      });

      // Delete the point
      await prisma.tourPoint.delete({
        where: { id: pointId },
      });
    });
  }

  async reorderPoints(tourId: string, pointIds: string[]): Promise<PointResponseDto[]> {
    // Verify tour exists
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      throw new NotFoundException('Tour not found');
    }

    // Update order for each point in a transaction
    // Use two-step approach to avoid unique constraint violations:
    // 1. Set all to negative temporary values
    // 2. Set to final positive values
    await this.prisma.$transaction(async (prisma) => {
      // Step 1: Set all points to negative temporary order values
      for (let i = 0; i < pointIds.length; i++) {
        await prisma.tourPoint.update({
          where: { id: pointIds[i] },
          data: { order: -(i + 1) },
        });
      }

      // Step 2: Set all points to final positive order values
      for (let i = 0; i < pointIds.length; i++) {
        await prisma.tourPoint.update({
          where: { id: pointIds[i] },
          data: { order: i + 1 },
        });
      }
    });

    // Return updated points
    return this.getPointsByTour(tourId);
  }

  // ==================== LOCALIZATION MANAGEMENT ====================

  async getLocalizationsByPoint(tourId: string, pointId: string): Promise<LocalizationResponseDto[]> {
    // Verify point exists and belongs to tour
    const point = await this.prisma.tourPoint.findUnique({
      where: { id: pointId },
    });

    if (!point) {
      throw new NotFoundException('Point not found');
    }

    if (point.tourId !== tourId) {
      throw new BadRequestException('Point does not belong to this tour');
    }

    const localizations = await this.prisma.tourPointLocalization.findMany({
      where: { tourPointId: pointId },
    });

    return localizations.map((loc) => ({
      id: loc.id,
      tourPointId: loc.tourPointId,
      tourVersionId: loc.tourVersionId,
      language: loc.language,
      title: loc.title,
      description: loc.description,
      audioFileId: loc.audioFileId,
      imageFileId: loc.imageFileId,
      subtitleFileId: loc.subtitleFileId,
    }));
  }

  async createLocalization(tourId: string, pointId: string, dto: CreateLocalizationDto): Promise<LocalizationResponseDto> {
    // Verify point exists and belongs to tour
    const point = await this.prisma.tourPoint.findUnique({
      where: { id: pointId },
    });

    if (!point) {
      throw new NotFoundException('Point not found');
    }

    if (point.tourId !== tourId) {
      throw new BadRequestException('Point does not belong to this tour');
    }

    // Find the tour version for this language
    const tourVersion = await this.prisma.tourVersion.findFirst({
      where: {
        tourId,
        language: dto.language,
      },
    });

    if (!tourVersion) {
      throw new NotFoundException(`No tour version found for language '${dto.language}'`);
    }

    // Check if localization for this point, version, and language already exists
    const existing = await this.prisma.tourPointLocalization.findFirst({
      where: {
        tourPointId: pointId,
        tourVersionId: tourVersion.id,
        language: dto.language,
      },
    });

    if (existing) {
      throw new ConflictException(`Localization for language '${dto.language}' already exists for this point`);
    }

    // Validate media file IDs if provided
    if (dto.audioFileId) {
      const audioFile = await this.prisma.mediaFile.findUnique({
        where: { id: dto.audioFileId },
      });
      if (!audioFile) {
        throw new NotFoundException('Audio file not found');
      }
    }

    if (dto.imageFileId) {
      const imageFile = await this.prisma.mediaFile.findUnique({
        where: { id: dto.imageFileId },
      });
      if (!imageFile) {
        throw new NotFoundException('Image file not found');
      }
    }

    if (dto.subtitleFileId) {
      const subtitleFile = await this.prisma.mediaFile.findUnique({
        where: { id: dto.subtitleFileId },
      });
      if (!subtitleFile) {
        throw new NotFoundException('Subtitle file not found');
      }
    }

    const localization = await this.prisma.tourPointLocalization.create({
      data: {
        tourPointId: pointId,
        tourVersionId: tourVersion.id,
        language: dto.language,
        title: dto.title,
        description: dto.description,
        audioFileId: dto.audioFileId,
        imageFileId: dto.imageFileId,
        subtitleFileId: dto.subtitleFileId,
      },
    });

    return {
      id: localization.id,
      tourPointId: localization.tourPointId,
      tourVersionId: localization.tourVersionId,
      language: localization.language,
      title: localization.title,
      description: localization.description,
      audioFileId: localization.audioFileId,
      imageFileId: localization.imageFileId,
      subtitleFileId: localization.subtitleFileId,
    };
  }

  async updateLocalization(tourId: string, pointId: string, localizationId: string, dto: UpdateLocalizationDto): Promise<LocalizationResponseDto> {
    // Verify localization exists
    const existing = await this.prisma.tourPointLocalization.findUnique({
      where: { id: localizationId },
      include: {
        tourPoint: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Localization not found');
    }

    if (existing.tourPointId !== pointId) {
      throw new BadRequestException('Localization does not belong to this point');
    }

    if (existing.tourPoint.tourId !== tourId) {
      throw new BadRequestException('Point does not belong to this tour');
    }

    // Validate media file IDs if provided
    if (dto.audioFileId) {
      const audioFile = await this.prisma.mediaFile.findUnique({
        where: { id: dto.audioFileId },
      });
      if (!audioFile) {
        throw new NotFoundException('Audio file not found');
      }
    }

    if (dto.imageFileId) {
      const imageFile = await this.prisma.mediaFile.findUnique({
        where: { id: dto.imageFileId },
      });
      if (!imageFile) {
        throw new NotFoundException('Image file not found');
      }
    }

    if (dto.subtitleFileId) {
      const subtitleFile = await this.prisma.mediaFile.findUnique({
        where: { id: dto.subtitleFileId },
      });
      if (!subtitleFile) {
        throw new NotFoundException('Subtitle file not found');
      }
    }

    // Remove undefined values from dto to avoid Prisma errors
    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.audioFileId !== undefined) updateData.audioFileId = dto.audioFileId;
    if (dto.imageFileId !== undefined) updateData.imageFileId = dto.imageFileId;
    if (dto.subtitleFileId !== undefined) updateData.subtitleFileId = dto.subtitleFileId;

    const localization = await this.prisma.tourPointLocalization.update({
      where: { id: localizationId },
      data: updateData,
    });

    return {
      id: localization.id,
      tourPointId: localization.tourPointId,
      tourVersionId: localization.tourVersionId,
      language: localization.language,
      title: localization.title,
      description: localization.description,
      audioFileId: localization.audioFileId,
      imageFileId: localization.imageFileId,
      subtitleFileId: localization.subtitleFileId,
    };
  }

  async deleteLocalization(tourId: string, pointId: string, localizationId: string): Promise<void> {
    // Verify localization exists
    const localization = await this.prisma.tourPointLocalization.findUnique({
      where: { id: localizationId },
      include: {
        tourPoint: true,
      },
    });

    if (!localization) {
      throw new NotFoundException('Localization not found');
    }

    if (localization.tourPointId !== pointId) {
      throw new BadRequestException('Localization does not belong to this point');
    }

    if (localization.tourPoint.tourId !== tourId) {
      throw new BadRequestException('Point does not belong to this tour');
    }

    await this.prisma.tourPointLocalization.delete({
      where: { id: localizationId },
    });
  }
}
