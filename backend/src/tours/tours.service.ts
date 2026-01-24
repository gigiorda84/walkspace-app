import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../common/storage.service';
import {
  TourListItemDto,
  TourDetailDto,
  TourPointDto,
  ManifestDto,
  AudioFileDto,
  ImageFileDto,
  SubtitleFileDto,
  OfflineMapDto,
} from './dto';

@Injectable()
export class ToursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async listTours(userId?: string): Promise<TourListItemDto[]> {
    const tours = await this.prisma.tour.findMany({
      include: {
        versions: {
          where: { status: 'published' },
          select: { language: true, title: true, description: true, completionMessage: true, busInfo: true, coverImage: true, coverTrailer: true },
        },
        coverImage: true,
        userAccess: userId ? { where: { userId } } : false,
      },
    });

    return Promise.all(
      tours.map(async (tour) => {
        const title: Record<string, string> = {};
        const descriptionPreview: Record<string, string> = {};
        const completionMessage: Record<string, string> = {};
        const busInfo: Record<string, string> = {};
        const languages: string[] = [];

        tour.versions.forEach((version) => {
          title[version.language] = version.title;
          descriptionPreview[version.language] = version.description.substring(0, 200) + '...';
          if (version.completionMessage) {
            completionMessage[version.language] = version.completionMessage;
          }
          if (version.busInfo) {
            busInfo[version.language] = version.busInfo;
          }
          languages.push(version.language);
        });

        // Use tour-level cover image if available, otherwise fall back to first version's cover image
        const coverImage = tour.coverImage || tour.versions.find((v) => v.coverImage)?.coverImage;
        const imageUrl = coverImage
          ? await this.storageService.getSignedUrl(coverImage.storagePath, 86400)
          : null;

        // Use first version's cover trailer if available
        const coverTrailer = tour.versions.find((v) => v.coverTrailer)?.coverTrailer;
        const coverTrailerUrl = coverTrailer
          ? await this.storageService.getSignedUrl(coverTrailer.storagePath, 86400)
          : null;

        return {
          id: tour.id,
          slug: tour.slug,
          title,
          descriptionPreview,
          completionMessage: Object.keys(completionMessage).length > 0 ? completionMessage : undefined,
          busInfo: Object.keys(busInfo).length > 0 ? busInfo : undefined,
          city: tour.defaultCity,
          durationMinutes: tour.defaultDurationMinutes,
          distanceKm: tour.defaultDistanceKm,
          difficulty: tour.defaultDifficulty,
          languages,
          isProtected: tour.isProtected,
          imageUrl,
          coverTrailerUrl,
          routePolyline: tour.routePolyline,
          hasAccess: userId ? tour.userAccess.length > 0 : undefined,
        };
      }),
    );
  }

  async getTourDetails(tourId: string, language: string, userId?: string): Promise<TourDetailDto> {
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
      include: {
        versions: {
          where: { language, status: 'published' },
          include: {
            coverImage: true,
            coverTrailer: true,
          },
        },
        coverImage: true,
      },
    });

    if (!tour) {
      throw new NotFoundException('Tour not found');
    }

    const version = tour.versions[0];
    if (!version) {
      throw new NotFoundException(`Tour not available in language: ${language}`);
    }

    // Check user access explicitly
    let hasAccess = !tour.isProtected; // Free tours always have access
    if (tour.isProtected && userId) {
      const userAccess = await this.prisma.userTourAccess.findFirst({
        where: {
          userId: userId,
          tourId: tour.id,
        },
      });
      hasAccess = !!userAccess;
    }

    const allVersions = await this.prisma.tourVersion.findMany({
      where: { tourId: tour.id, status: 'published' },
      select: { language: true },
    });

    // Use version cover image if available, otherwise fall back to tour cover image
    const coverImage = version.coverImage || tour.coverImage;
    const imageUrl = coverImage
      ? await this.storageService.getSignedUrl(coverImage.storagePath, 86400)
      : null;

    // Generate signed URL for cover trailer if available
    const coverTrailerUrl = version.coverTrailer
      ? await this.storageService.getSignedUrl(version.coverTrailer.storagePath, 86400)
      : null;

    return {
      id: tour.id,
      slug: tour.slug,
      title: version.title,
      description: version.description,
      completionMessage: version.completionMessage,
      busInfo: version.busInfo,
      city: tour.defaultCity,
      durationMinutes: tour.defaultDurationMinutes,
      distanceKm: tour.defaultDistanceKm,
      difficulty: tour.defaultDifficulty,
      languages: allVersions.map((v) => v.language),
      isProtected: tour.isProtected,
      imageUrl,
      coverTrailerUrl,
      startingPoint: {
        lat: version.startingPointLat,
        lng: version.startingPointLng,
      },
      routePolyline: tour.routePolyline,
      downloadInfo: {
        estimatedSizeMb: 180, // Placeholder - would calculate from media files
        isDownloaded: false, // Client-side state
      },
      hasAccess,
    };
  }

  async getTourManifest(tourId: string, language: string, userId?: string): Promise<ManifestDto> {
    // Check access first
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      throw new NotFoundException('Tour not found');
    }

    // Check user access explicitly for protected tours
    if (tour.isProtected) {
      if (!userId) {
        throw new ForbiddenException('Access denied. Redeem a voucher to access this tour.');
      }
      const userAccess = await this.prisma.userTourAccess.findFirst({
        where: {
          userId: userId,
          tourId: tour.id,
        },
      });
      if (!userAccess) {
        throw new ForbiddenException('Access denied. Redeem a voucher to access this tour.');
      }
    }

    const version = await this.prisma.tourVersion.findFirst({
      where: { tourId, language, status: 'published' },
    });

    if (!version) {
      throw new NotFoundException(`Tour not available in language: ${language}`);
    }

    const points = await this.prisma.tourPoint.findMany({
      where: { tourId },
      include: {
        localizations: {
          where: { tourVersionId: version.id, language },
          include: {
            audioFile: true,
            imageFile: true,
            subtitleFile: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    const audio: AudioFileDto[] = [];
    const images: ImageFileDto[] = [];
    const subtitles: SubtitleFileDto[] = [];

    // Generate signed URLs for all media files
    for (const point of points) {
      const localization = point.localizations[0];
      if (localization) {
        if (localization.audioFile) {
          const fileUrl = await this.storageService.getSignedUrl(
            localization.audioFile.storagePath,
            86400, // 24 hours expiry
          );
          audio.push({
            pointId: point.id,
            order: point.order,
            fileUrl,
            fileSizeBytes: localization.audioFile.fileSizeBytes,
          });
        }
        if (localization.imageFile) {
          const fileUrl = await this.storageService.getSignedUrl(
            localization.imageFile.storagePath,
            86400, // 24 hours expiry
          );
          images.push({
            pointId: point.id,
            fileUrl,
            fileSizeBytes: localization.imageFile.fileSizeBytes,
          });
        }
        if (localization.subtitleFile) {
          const fileUrl = await this.storageService.getSignedUrl(
            localization.subtitleFile.storagePath,
            86400, // 24 hours expiry
          );
          subtitles.push({
            pointId: point.id,
            language,
            fileUrl,
            fileSizeBytes: localization.subtitleFile.fileSizeBytes,
          });
        }
      }
    }

    // Mock offline map configuration
    const offlineMap: OfflineMapDto = {
      tilesUrlTemplate: 'https://tiles.example.org/{z}/{x}/{y}.pbf',
      bounds: {
        north: version.startingPointLat + 0.1,
        south: version.startingPointLat - 0.1,
        east: version.startingPointLng + 0.1,
        west: version.startingPointLng - 0.1,
      },
      recommendedZoomLevels: [14, 15, 16],
    };

    return {
      tourId: tour.id,
      language,
      version: version.versionNumber,
      audio,
      images,
      subtitles,
      offlineMap,
    };
  }

  async getTourPoints(tourId: string, language: string, userId?: string): Promise<TourPointDto[]> {
    // Check access first
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      throw new NotFoundException('Tour not found');
    }

    // Check user access explicitly for protected tours
    if (tour.isProtected) {
      if (!userId) {
        throw new ForbiddenException('Access denied. Redeem a voucher to access this tour.');
      }
      const userAccess = await this.prisma.userTourAccess.findFirst({
        where: {
          userId: userId,
          tourId: tour.id,
        },
      });
      if (!userAccess) {
        throw new ForbiddenException('Access denied. Redeem a voucher to access this tour.');
      }
    }

    const version = await this.prisma.tourVersion.findFirst({
      where: { tourId, language, status: 'published' },
    });

    if (!version) {
      throw new NotFoundException(`Tour not available in language: ${language}`);
    }

    const points = await this.prisma.tourPoint.findMany({
      where: { tourId },
      include: {
        localizations: {
          where: { tourVersionId: version.id, language },
        },
      },
      orderBy: { order: 'asc' },
    });

    return points.map((point) => {
      const localization = point.localizations[0];
      return {
        id: point.id,
        order: point.order,
        title: localization?.title || 'Untitled Point',
        description: localization?.description || '',
        location: {
          lat: point.lat,
          lng: point.lng,
        },
        triggerRadiusMeters: point.defaultTriggerRadiusMeters,
      };
    });
  }
}
