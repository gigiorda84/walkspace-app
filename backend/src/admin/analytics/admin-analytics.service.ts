import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  AnalyticsOverviewDto,
  DurationAnalyticsDto,
  EngagementAnalyticsDto,
  TourAnalyticsItemDto,
  SessionItemDto,
} from './dto';

// A session with no terminal event older than this is treated as "incomplete"
// (likely abandoned but the app never reported it) instead of staying "in-progress"
// forever. Tours run ~30–60 min, so 6h is a safe cutoff.
const STALE_SESSION_HOURS = 6;

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private getDateFilter(period: string): Date | null {
    const now = new Date();
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  }

  async getOverview(period: string = '30d'): Promise<AnalyticsOverviewDto> {
    const dateFilter = this.getDateFilter(period);
    const whereClause = dateFilter ? { createdAt: { gte: dateFilter } } : {};

    // Get tour starts
    const starts = await this.prisma.analyticsEvent.count({
      where: { ...whereClause, name: 'tour_started' },
    });

    // Get completions
    const completions = await this.prisma.analyticsEvent.count({
      where: { ...whereClause, name: 'tour_completed' },
    });

    // Get unique devices (anonymousId)
    const uniqueDevices = await this.prisma.analyticsEvent.groupBy({
      by: ['anonymousId'],
      where: {
        ...whereClause,
        name: 'tour_started',
        anonymousId: { not: null },
      },
    });

    // Platform breakdown from osVersion field
    const iosCount = await this.prisma.analyticsEvent.count({
      where: {
        ...whereClause,
        name: 'tour_started',
        osVersion: { contains: 'ios', mode: 'insensitive' },
      },
    });

    const androidCount = await this.prisma.analyticsEvent.count({
      where: {
        ...whereClause,
        name: 'tour_started',
        osVersion: { contains: 'android', mode: 'insensitive' },
      },
    });

    // Trigger breakdown from properties.triggerType
    const allStarts = await this.prisma.analyticsEvent.findMany({
      where: { ...whereClause, name: 'tour_started' },
      select: { properties: true },
    });

    let gpsCount = 0;
    let manualCount = 0;
    allStarts.forEach((event) => {
      const props = event.properties as Record<string, any> | null;
      if (props?.triggerType === 'gps') gpsCount++;
      else if (props?.triggerType === 'manual') manualCount++;
    });

    return {
      totalStarts: starts,
      totalCompletions: completions,
      uniqueDevices: uniqueDevices.length,
      platformBreakdown: {
        ios: iosCount,
        android: androidCount,
      },
      triggerBreakdown: {
        gps: gpsCount,
        manual: manualCount,
      },
    };
  }

  async getDurationAnalytics(period: string = '30d'): Promise<DurationAnalyticsDto> {
    const dateFilter = this.getDateFilter(period);
    const whereClause = dateFilter ? { createdAt: { gte: dateFilter } } : {};

    // Get completed tours with duration
    const completedEvents = await this.prisma.analyticsEvent.findMany({
      where: { ...whereClause, name: 'tour_completed' },
      select: { properties: true },
    });

    // Get abandoned tours
    const abandonedEvents = await this.prisma.analyticsEvent.findMany({
      where: { ...whereClause, name: 'tour_abandoned' },
      select: { properties: true },
    });

    // Calculate averages by trigger type
    let gpsTotal = 0, gpsCount = 0;
    let manualTotal = 0, manualCount = 0;

    completedEvents.forEach((event) => {
      const props = event.properties as Record<string, any> | null;
      const duration = props?.durationMinutes || 0;
      if (props?.triggerType === 'gps') {
        gpsTotal += duration;
        gpsCount++;
      } else if (props?.triggerType === 'manual') {
        manualTotal += duration;
        manualCount++;
      }
    });

    let abandonedTotal = 0;
    abandonedEvents.forEach((event) => {
      const props = event.properties as Record<string, any> | null;
      abandonedTotal += props?.durationMinutes || 0;
    });

    return {
      avgDurationGpsCompleted: gpsCount > 0 ? Math.round((gpsTotal / gpsCount) * 10) / 10 : 0,
      avgDurationManualCompleted: manualCount > 0 ? Math.round((manualTotal / manualCount) * 10) / 10 : 0,
      avgDurationAbandoned: abandonedEvents.length > 0
        ? Math.round((abandonedTotal / abandonedEvents.length) * 10) / 10
        : 0,
      totalGpsCompleted: gpsCount,
      totalManualCompleted: manualCount,
      totalAbandoned: abandonedEvents.length,
    };
  }

  async getEngagementAnalytics(period: string = '30d'): Promise<EngagementAnalyticsDto> {
    const dateFilter = this.getDateFilter(period);
    const whereClause = dateFilter ? { createdAt: { gte: dateFilter } } : {};

    // Get total completions for percentage calculation
    const totalCompletions = await this.prisma.analyticsEvent.count({
      where: { ...whereClause, name: 'tour_completed' },
    });

    // Get follow us clicks
    const followUsClicks = await this.prisma.analyticsEvent.count({
      where: { ...whereClause, name: 'follow_us_clicked' },
    });

    // Get contact clicks with channel breakdown
    const contactEvents = await this.prisma.analyticsEvent.findMany({
      where: { ...whereClause, name: 'contact_clicked' },
      select: { properties: true },
    });

    // Count by channel
    const channelCounts: Record<string, number> = {};
    contactEvents.forEach((event) => {
      const props = event.properties as Record<string, any> | null;
      const channel = props?.channel || 'unknown';
      channelCounts[channel] = (channelCounts[channel] || 0) + 1;
    });

    const channelBreakdown = Object.entries(channelCounts).map(([channel, clicks]) => ({
      channel,
      clicks,
      percentOfCompletions: totalCompletions > 0
        ? Math.round((clicks / totalCompletions) * 1000) / 10
        : 0,
    }));

    // Get donation clicks with provider breakdown (PayPal / Satispay)
    const donationEvents = await this.prisma.analyticsEvent.findMany({
      where: { ...whereClause, name: 'donation_link_clicked' },
      select: { properties: true },
    });

    const providerCounts: Record<string, number> = {};
    donationEvents.forEach((event) => {
      const props = event.properties as Record<string, any> | null;
      const provider = props?.provider || 'unknown';
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    });

    const donationBreakdown = Object.entries(providerCounts)
      .map(([provider, clicks]) => ({
        provider,
        clicks,
        percentOfCompletions: totalCompletions > 0
          ? Math.round((clicks / totalCompletions) * 1000) / 10
          : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks);

    const donationClicks = donationEvents.length;

    // Total contact clicks = sum of all channel clicks
    const totalContactClicks = contactEvents.length;

    return {
      followUsClicks,
      followUsPercent: totalCompletions > 0
        ? Math.round((followUsClicks / totalCompletions) * 1000) / 10
        : 0,
      totalContactClicks,
      totalContactPercent: totalCompletions > 0
        ? Math.round((totalContactClicks / totalCompletions) * 1000) / 10
        : 0,
      channelBreakdown,
      donationClicks,
      donationBreakdown,
      donationPercent: totalCompletions > 0
        ? Math.round((donationClicks / totalCompletions) * 1000) / 10
        : 0,
      totalCompletions,
    };
  }

  async getTourAnalytics(period: string = '30d'): Promise<TourAnalyticsItemDto[]> {
    const dateFilter = this.getDateFilter(period);
    const whereClause = dateFilter ? { createdAt: { gte: dateFilter } } : {};

    // Get all tours
    const tours = await this.prisma.tour.findMany({
      include: {
        versions: {
          where: { status: 'published' },
          take: 1,
        },
      },
    });

    const result: TourAnalyticsItemDto[] = [];

    for (const tour of tours) {
      const tourWhere = { ...whereClause, tourId: tour.id };

      // Get starts
      const starts = await this.prisma.analyticsEvent.count({
        where: { ...tourWhere, name: 'tour_started' },
      });

      // Get completions
      const completions = await this.prisma.analyticsEvent.count({
        where: { ...tourWhere, name: 'tour_completed' },
      });

      // Get trigger breakdown
      const startEvents = await this.prisma.analyticsEvent.findMany({
        where: { ...tourWhere, name: 'tour_started' },
        select: { properties: true },
      });

      let gpsTriggered = 0;
      let manualTriggered = 0;
      startEvents.forEach((event) => {
        const props = event.properties as Record<string, any> | null;
        if (props?.triggerType === 'gps') gpsTriggered++;
        else if (props?.triggerType === 'manual') manualTriggered++;
      });

      // Get avg duration from completed events
      const completedEvents = await this.prisma.analyticsEvent.findMany({
        where: { ...tourWhere, name: 'tour_completed' },
        select: { properties: true },
      });

      // Average only over completions that actually reported a duration > 0.
      // (Older Android builds send tour_completed without durationMinutes; counting
      // those as 0 would drag the average down artificially.)
      let totalDuration = 0;
      let completionsWithDuration = 0;
      completedEvents.forEach((event) => {
        const props = event.properties as Record<string, any> | null;
        const duration = props?.durationMinutes || 0;
        if (duration > 0) {
          totalDuration += duration;
          completionsWithDuration++;
        }
      });

      const tourName = tour.versions[0]?.title || tour.slug;

      result.push({
        tourId: tour.id,
        tourName,
        starts,
        completions,
        completionRate: starts > 0 ? Math.round((completions / starts) * 1000) / 10 : 0,
        avgDurationMinutes: completionsWithDuration > 0
          ? Math.round((totalDuration / completionsWithDuration) * 10) / 10
          : 0,
        completionsWithDuration,
        gpsTriggered,
        manualTriggered,
      });
    }

    // Sort by starts descending
    return result.sort((a, b) => b.starts - a.starts);
  }

  async getSessions(period: string = '30d'): Promise<SessionItemDto[]> {
    const dateFilter = this.getDateFilter(period);
    const whereClause = dateFilter ? { createdAt: { gte: dateFilter } } : {};

    // 1. Get tour_started events (last 50)
    const startEvents = await this.prisma.analyticsEvent.findMany({
      where: { ...whereClause, name: 'tour_started' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (startEvents.length === 0) return [];

    // Collect unique anonymousIds and tourIds from starts
    const anonIds = [...new Set(startEvents.map((e) => e.anonymousId).filter(Boolean))] as string[];
    const tourIds = [...new Set(startEvents.map((e) => e.tourId).filter(Boolean))] as string[];

    // 2. Get terminal events (tour_completed / tour_abandoned) for these users+tours
    const terminalEvents = anonIds.length > 0 ? await this.prisma.analyticsEvent.findMany({
      where: {
        name: { in: ['tour_completed', 'tour_abandoned'] },
        anonymousId: { in: anonIds },
        tourId: { in: tourIds },
      },
      orderBy: { createdAt: 'asc' },
    }) : [];

    // 3. Get point_triggered events for these users+tours
    const pointEvents = anonIds.length > 0 ? await this.prisma.analyticsEvent.findMany({
      where: {
        name: 'point_triggered',
        anonymousId: { in: anonIds },
        tourId: { in: tourIds },
      },
      orderBy: { createdAt: 'asc' },
    }) : [];

    // 4. Get tour names
    const tours = tourIds.length > 0 ? await this.prisma.tour.findMany({
      where: { id: { in: tourIds } },
      include: { versions: { where: { status: 'published' }, take: 1 } },
    }) : [];
    const tourNameMap = new Map(tours.map((t) => [t.id, t.versions[0]?.title || t.slug]));

    // 5. Build sessions by matching starts to terminal events
    return startEvents.map((start) => {
      const props = start.properties as Record<string, any> | null;

      // Find the first terminal event for same anonymousId + tourId after start time
      const terminal = terminalEvents.find(
        (e) =>
          e.anonymousId === start.anonymousId &&
          e.tourId === start.tourId &&
          e.createdAt > start.createdAt,
      );

      // Count point_triggered events between start and terminal (or now)
      const endTime = terminal?.createdAt || new Date();
      const pointCount = pointEvents.filter(
        (e) =>
          e.anonymousId === start.anonymousId &&
          e.tourId === start.tourId &&
          e.createdAt > start.createdAt &&
          e.createdAt <= endTime,
      ).length;

      const terminalProps = terminal?.properties as Record<string, any> | null;

      let status: 'completed' | 'abandoned' | 'in-progress' | 'incomplete' = 'in-progress';
      if (terminal?.name === 'tour_completed') status = 'completed';
      else if (terminal?.name === 'tour_abandoned') status = 'abandoned';
      else {
        // No terminal event: still running if recent, otherwise stale/abandoned.
        const ageMs = Date.now() - start.createdAt.getTime();
        if (ageMs > STALE_SESSION_HOURS * 60 * 60 * 1000) status = 'incomplete';
      }

      return {
        tourId: start.tourId || '',
        tourName: tourNameMap.get(start.tourId || '') || 'Unknown Tour',
        startedAt: start.createdAt.toISOString(),
        device: start.device || '\u2014',
        osVersion: start.osVersion || '\u2014',
        status,
        durationMinutes: terminalProps?.durationMinutes ?? null,
        pointsTriggered: pointCount,
        triggerType: props?.triggerType ?? null,
        language: start.language || null,
      };
    });
  }

  // Export raw analytics events for the period as a downloadable file.
  // Read-only: data is never modified or deleted.
  async exportEvents(
    period: string = 'all',
    format: 'csv' | 'json' = 'csv',
  ): Promise<{ body: string; contentType: string; filename: string }> {
    const dateFilter = this.getDateFilter(period);
    const whereClause = dateFilter ? { createdAt: { gte: dateFilter } } : {};

    const events = await this.prisma.analyticsEvent.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
    });

    const stamp = new Date().toISOString().slice(0, 10);

    if (format === 'json') {
      return {
        body: JSON.stringify(events, null, 2),
        contentType: 'application/json',
        filename: `analytics-${period}-${stamp}.json`,
      };
    }

    const columns = [
      'id', 'name', 'createdAt', 'userId', 'anonymousId', 'tourId',
      'pointId', 'language', 'device', 'osVersion', 'properties',
    ];
    const escape = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const rows = events.map((e) =>
      columns
        .map((col) => escape(col === 'createdAt' ? e.createdAt.toISOString() : (e as any)[col]))
        .join(','),
    );
    const csv = [columns.join(','), ...rows].join('\n');

    return {
      body: csv,
      contentType: 'text/csv',
      filename: `analytics-${period}-${stamp}.csv`,
    };
  }
}
