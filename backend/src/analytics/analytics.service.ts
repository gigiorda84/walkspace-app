import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TrackEventDto } from './dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async trackEvents(events: TrackEventDto[], currentUserId?: string): Promise<void> {
    if (events.length === 0) {
      return;
    }

    await this.prisma.analyticsEvent.createMany({
      data: events.map((event) => ({
        name: event.name,
        userId: event.userId || currentUserId || undefined,
        anonymousId: event.anonymousId || undefined,
        tourId: event.tourId || undefined,
        pointId: event.pointId || undefined,
        language: event.language || undefined,
        device: event.device || undefined,
        osVersion: event.osVersion || undefined,
        properties: event.properties ? JSON.parse(JSON.stringify(event.properties)) : undefined,
        createdAt: event.timestamp ? new Date(event.timestamp) : new Date(),
      })),
    });
  }
}
