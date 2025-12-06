import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TrackEventDto } from './dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async trackEvents(events: TrackEventDto[], currentUserId?: string): Promise<void> {
    // Filter events based on GDPR consent
    const validEvents = await this.filterEventsByConsent(events, currentUserId);

    if (validEvents.length === 0) {
      return; // No events to track
    }

    // Batch insert all events
    await this.prisma.analyticsEvent.createMany({
      data: validEvents.map((event) => ({
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

  private async filterEventsByConsent(
    events: TrackEventDto[],
    currentUserId?: string,
  ): Promise<TrackEventDto[]> {
    // Group events by user ID
    const userIds = new Set<string>();

    // Add current user if exists
    if (currentUserId) {
      userIds.add(currentUserId);
    }

    // Add user IDs from events
    events.forEach((event) => {
      if (event.userId) {
        userIds.add(event.userId);
      }
    });

    // If no user IDs, all events are anonymous - allow them
    if (userIds.size === 0) {
      return events;
    }

    // Fetch users and their consent status
    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: Array.from(userIds),
        },
      },
      select: {
        id: true,
        mailingListOptIn: true,
      },
    });

    // Create a map of user consent
    const consentMap = new Map<string, boolean>();
    users.forEach((user) => {
      consentMap.set(user.id, user.mailingListOptIn);
    });

    // Filter events based on consent
    return events.filter((event) => {
      const userId = event.userId || currentUserId;

      // Allow anonymous events (no user ID)
      if (!userId) {
        return true;
      }

      // Check if user has opted in
      const hasConsent = consentMap.get(userId);
      return hasConsent === true;
    });
  }
}
