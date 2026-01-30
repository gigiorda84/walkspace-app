# Phase 8: Analytics Dashboard - Implementation Plan

## Overview
Build a comprehensive analytics dashboard for the CMS to track user engagement, tour performance, and voucher redemption metrics. This will provide content managers with insights into how their tours are performing and where users are engaging.

**Key Features:**
- Real-time analytics overview with key metrics
- Tour performance tracking (views, downloads, completions)
- User activity analytics (signups, active users)
- Voucher redemption statistics
- Geographic distribution (if available)
- Data visualization with charts and graphs
- Export capabilities (CSV)

---

## Current Backend Status

### Existing Database Schema ✅

**analytics_events table:**
```sql
- id (uuid, primary key)
- user_id (uuid, nullable) - Links to users table
- anonymous_id (uuid, nullable) - For non-logged-in users
- event_type (text) - e.g., 'app_open', 'tour_started', 'point_triggered'
- properties (jsonb) - Flexible event metadata
- created_at (timestamp)
```

**Event Types Already Defined:**
- `app_open` - User opens the app
- `signup` - New user registration
- `login` - User login
- `tour_viewed` - User views tour details
- `tour_download_started` - User starts downloading tour
- `tour_download_completed` - Tour download finishes
- `tour_download_deleted` - User deletes downloaded tour
- `tour_started` - User starts walking a tour
- `point_triggered` - User reaches a GPS point
- `tour_completed` - User finishes entire tour
- `voucher_redeemed` - User redeems a voucher code
- `donation_link_clicked` - User clicks donation link

### Existing Backend Endpoints

**Analytics Ingestion:**
- ✅ `POST /analytics/events` - Mobile app sends events here
  - Accepts batch event ingestion
  - Validates event structure
  - Stores in analytics_events table

**Missing Backend Endpoints:** ❌

We need to create analytics retrieval endpoints:
- `GET /admin/analytics/overview` - Dashboard overview stats
- `GET /admin/analytics/tours/:tourId` - Per-tour analytics
- `GET /admin/analytics/users` - User activity stats
- `GET /admin/analytics/vouchers` - Voucher redemption stats
- `GET /admin/analytics/events` - Raw event data with filters
- `GET /admin/analytics/export` - CSV export of analytics

---

## Backend Tasks

### 1. Create Analytics Admin Service

**File:** `backend/src/analytics/admin-analytics.service.ts`

**Methods to implement:**

```typescript
class AdminAnalyticsService {
  // Overview statistics
  async getOverviewStats(dateRange?: { start: Date; end: Date }): Promise<{
    totalUsers: number;
    totalTours: number;
    totalDownloads: number;
    totalCompletions: number;
    activeUsersLast30Days: number;
    newUsersLast30Days: number;
    topTours: Array<{ tourId: string; title: string; views: number; downloads: number }>;
    recentActivity: AnalyticsEvent[];
  }>;

  // Tour-specific analytics
  async getTourAnalytics(tourId: string, dateRange?: { start: Date; end: Date }): Promise<{
    views: number;
    downloads: number;
    completions: number;
    averageCompletionTime: number;
    completionRate: number;
    pointTriggerStats: Array<{ pointId: string; sequenceOrder: number; triggers: number }>;
    dailyActivity: Array<{ date: string; views: number; downloads: number; starts: number }>;
  }>;

  // User activity analytics
  async getUserActivityStats(dateRange?: { start: Date; end: Date }): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    signupsOverTime: Array<{ date: string; count: number }>;
    activeUsersOverTime: Array<{ date: string; count: number }>;
    usersByLanguage: Array<{ language: string; count: number }>;
  }>;

  // Voucher redemption analytics
  async getVoucherStats(dateRange?: { start: Date; end: Date }): Promise<{
    totalVouchers: number;
    redeemedVouchers: number;
    redemptionRate: number;
    redemptionsOverTime: Array<{ date: string; count: number }>;
    topRedeemedBatches: Array<{ batchId: string; name: string; redemptions: number }>;
  }>;

  // Raw event data with filters
  async getEvents(filters: {
    eventType?: string;
    userId?: string;
    tourId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{
    events: AnalyticsEvent[];
    total: number;
  }>;

  // Export to CSV
  async exportAnalytics(type: 'overview' | 'tours' | 'users' | 'vouchers', dateRange?: { start: Date; end: Date }): Promise<string>;
}
```

**Steps:**
1. Create service with complex SQL queries for aggregations
2. Use raw SQL or query builder for performance
3. Add caching for expensive queries (Redis optional)
4. Implement date range filtering
5. Add pagination for large datasets

---

### 2. Create Analytics Admin Controller

**File:** `backend/src/analytics/admin-analytics.controller.ts`

**Endpoints:**

```typescript
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminAnalyticsController {
  @Get('overview')
  @Roles('admin', 'editor')
  async getOverview(@Query() params: { startDate?: string; endDate?: string }) {
    // Returns overview statistics
  }

  @Get('tours/:tourId')
  @Roles('admin', 'editor')
  async getTourAnalytics(@Param('tourId') tourId: string, @Query() params: { startDate?: string; endDate?: string }) {
    // Returns tour-specific analytics
  }

  @Get('users')
  @Roles('admin', 'editor')
  async getUserStats(@Query() params: { startDate?: string; endDate?: string }) {
    // Returns user activity stats
  }

  @Get('vouchers')
  @Roles('admin', 'editor')
  async getVoucherStats(@Query() params: { startDate?: string; endDate?: string }) {
    // Returns voucher redemption stats
  }

  @Get('events')
  @Roles('admin', 'editor')
  async getEvents(@Query() params: EventFilters) {
    // Returns filtered event list
  }

  @Get('export')
  @Roles('admin')
  async exportAnalytics(@Query() params: { type: string; startDate?: string; endDate?: string }) {
    // Returns CSV file
  }
}
```

**Steps:**
1. Create controller with endpoints
2. Add DTO validation for query parameters
3. Add role-based access control
4. Implement CSV response headers for export
5. Add rate limiting for expensive queries

---

### 3. Add DTOs for Analytics Responses

**File:** `backend/src/analytics/dto/analytics-response.dto.ts`

**DTOs needed:**
- `OverviewStatsDto`
- `TourAnalyticsDto`
- `UserActivityStatsDto`
- `VoucherStatsDto`
- `EventFilterDto`
- `TimeSeriesDataPointDto`

---

## Frontend Tasks

### 1. Create Analytics API Client

**File:** `cms/src/lib/api/analytics.ts`

**Methods:**
```typescript
export const analyticsApi = {
  // Get overview statistics
  async getOverview(dateRange?: { startDate: string; endDate: string }): Promise<OverviewStats>,

  // Get tour-specific analytics
  async getTourAnalytics(tourId: string, dateRange?: { startDate: string; endDate: string }): Promise<TourAnalytics>,

  // Get user activity stats
  async getUserStats(dateRange?: { startDate: string; endDate: string }): Promise<UserActivityStats>,

  // Get voucher redemption stats
  async getVoucherStats(dateRange?: { startDate: string; endDate: string }): Promise<VoucherStats>,

  // Get filtered events
  async getEvents(filters: EventFilters): Promise<{ events: AnalyticsEvent[]; total: number }>,

  // Export analytics as CSV
  async exportAnalytics(type: 'overview' | 'tours' | 'users' | 'vouchers', dateRange?: { startDate: string; endDate: string }): Promise<Blob>,
};
```

---

### 2. Create Analytics Dashboard Page

**File:** `cms/src/app/analytics/page.tsx`

**Features:**
- Overview statistics cards (total users, tours, downloads, completions)
- Date range selector (Last 7 days, 30 days, 90 days, Custom)
- Top tours table
- User signups chart (line chart over time)
- Active users chart
- Recent activity feed
- Quick links to detailed views

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Analytics Dashboard                     [Date Range]│
├─────────────────────────────────────────────────────┤
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐            │
│ │Users  │ │Tours  │ │Down-  │ │Comple-│            │
│ │1,234  │ │45     │ │loads  │ │tions  │            │
│ │+12%   │ │+3     │ │890    │ │234    │            │
│ └───────┘ └───────┘ └───────┘ └───────┘            │
├─────────────────────────────────────────────────────┤
│ User Signups Over Time          Top Tours           │
│ ┌─────────────────────┐        ┌─────────────────┐ │
│ │                     │        │ 1. Tour A  234  │ │
│ │   [Line Chart]      │        │ 2. Tour B  189  │ │
│ │                     │        │ 3. Tour C  156  │ │
│ └─────────────────────┘        └─────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Recent Activity                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ User X started Tour A                2 min ago  │ │
│ │ User Y completed Tour B              5 min ago  │ │
│ │ User Z redeemed voucher CODE123      10 min ago │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Components to create:**
- `StatCard` - Displays single metric with trend
- `DateRangeSelector` - Dropdown for date range selection
- `TopToursTable` - Table of top performing tours
- `RecentActivityFeed` - List of recent events
- `LineChart` - Reusable line chart component
- `BarChart` - Reusable bar chart component

---

### 3. Create Tour Analytics Detail Page

**File:** `cms/src/app/analytics/tours/[tourId]/page.tsx`

**Features:**
- Tour-specific metrics (views, downloads, starts, completions)
- Completion rate and average time
- Point trigger heatmap
- Daily activity chart
- Download-to-completion funnel
- Point performance table (which points are most/least triggered)

---

### 4. Create Charts Library Components

**Recommended Library:** Recharts (lightweight, React-friendly)

**Installation:**
```bash
npm install recharts
```

**Components to create:**

1. **LineChart Component**
   - File: `cms/src/components/analytics/LineChart.tsx`
   - Props: `data`, `xKey`, `yKey`, `color`, `height`
   - Used for: Signups over time, active users trend

2. **BarChart Component**
   - File: `cms/src/components/analytics/BarChart.tsx`
   - Props: `data`, `xKey`, `yKey`, `color`, `height`
   - Used for: Tour comparisons, point triggers

3. **PieChart Component**
   - File: `cms/src/components/analytics/PieChart.tsx`
   - Props: `data`, `nameKey`, `valueKey`, `colors`
   - Used for: Language distribution, tour type breakdown

4. **StatCard Component**
   - File: `cms/src/components/analytics/StatCard.tsx`
   - Props: `title`, `value`, `change`, `trend`
   - Used for: Overview statistics display

---

### 5. Add Date Range Selector

**File:** `cms/src/components/analytics/DateRangeSelector.tsx`

**Features:**
- Preset ranges (Last 7 days, 30 days, 90 days, All time)
- Custom date range picker
- Updates URL params for sharing
- Persists selection in localStorage

**Implementation:**
```typescript
type DateRange = {
  startDate: string;
  endDate: string;
  label: string;
};

const presetRanges: DateRange[] = [
  { label: 'Last 7 days', startDate: '...', endDate: '...' },
  { label: 'Last 30 days', startDate: '...', endDate: '...' },
  { label: 'Last 90 days', startDate: '...', endDate: '...' },
  { label: 'All time', startDate: null, endDate: null },
];
```

---

### 6. Add Export Functionality

**File:** `cms/src/components/analytics/ExportButton.tsx`

**Features:**
- Export button with dropdown (CSV, PDF future)
- Triggers download with current filters
- Shows loading state during export
- Success/error notifications

**Implementation:**
```typescript
async function handleExport(type: 'overview' | 'tours' | 'users' | 'vouchers') {
  const blob = await analyticsApi.exportAnalytics(type, dateRange);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${type}-analytics-${new Date().toISOString()}.csv`;
  a.click();
}
```

---

## Implementation Order

### Phase 8.1: Backend Foundation (2-3 hours)
1. Create `admin-analytics.service.ts`
2. Implement basic aggregation queries (overview stats)
3. Create `admin-analytics.controller.ts`
4. Add DTOs for responses
5. Test endpoints with Postman/Thunder Client

### Phase 8.2: Frontend API Client (30 min)
1. Create `cms/src/lib/api/analytics.ts`
2. Add TypeScript types for analytics data
3. Test API integration

### Phase 8.3: Basic Dashboard Page (2 hours)
1. Create `/analytics` page route
2. Add StatCard components
3. Fetch and display overview statistics
4. Add date range selector
5. Style with Tailwind CSS

### Phase 8.4: Data Visualization (2-3 hours)
1. Install Recharts library
2. Create LineChart component
3. Create BarChart component
4. Add charts to dashboard (signups over time, active users)
5. Add top tours table

### Phase 8.5: Tour Analytics Detail (2 hours)
1. Create tour analytics detail page
2. Fetch tour-specific data
3. Add point trigger statistics
4. Add completion funnel visualization
5. Test with real tour data

### Phase 8.6: Export & Polish (1-2 hours)
1. Implement CSV export functionality
2. Add export button to dashboard
3. Add loading states and error handling
4. Improve responsive design
5. Add empty states

### Phase 8.7: Testing (1 hour)
1. Test all analytics queries with real data
2. Verify date range filtering works
3. Test export functionality
4. Check performance with large datasets
5. Test on mobile/tablet screens

---

## File Structure

```
backend/src/
└── analytics/
    ├── analytics.module.ts
    ├── analytics.controller.ts           # Mobile app event ingestion (exists)
    ├── analytics.service.ts              # Event storage (exists)
    ├── admin-analytics.controller.ts     # NEW: Admin analytics endpoints
    ├── admin-analytics.service.ts        # NEW: Analytics aggregation logic
    └── dto/
        ├── analytics-event.dto.ts        # Exists
        ├── analytics-response.dto.ts     # NEW: Response DTOs
        └── event-filter.dto.ts           # NEW: Query filter DTOs

cms/src/
├── app/
│   └── analytics/
│       ├── page.tsx                      # Dashboard overview
│       ├── tours/
│       │   └── [tourId]/
│       │       └── page.tsx              # Tour-specific analytics
│       └── users/
│           └── page.tsx                  # User activity (optional)
├── components/
│   └── analytics/
│       ├── StatCard.tsx                  # Metric card
│       ├── LineChart.tsx                 # Line chart wrapper
│       ├── BarChart.tsx                  # Bar chart wrapper
│       ├── PieChart.tsx                  # Pie chart wrapper
│       ├── DateRangeSelector.tsx         # Date range picker
│       ├── ExportButton.tsx              # Export CSV button
│       ├── TopToursTable.tsx             # Top tours table
│       └── RecentActivityFeed.tsx        # Activity feed
└── lib/
    └── api/
        └── analytics.ts                  # Analytics API client
```

---

## Data Aggregation Queries

### Example: Get Overview Stats

```sql
-- Total users
SELECT COUNT(*) FROM users;

-- New users last 30 days
SELECT COUNT(*)
FROM users
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Active users last 30 days
SELECT COUNT(DISTINCT user_id)
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND user_id IS NOT NULL;

-- Total downloads
SELECT COUNT(*)
FROM analytics_events
WHERE event_type = 'tour_download_completed';

-- Top tours by views
SELECT
  properties->>'tour_id' as tour_id,
  COUNT(*) as views
FROM analytics_events
WHERE event_type = 'tour_viewed'
GROUP BY properties->>'tour_id'
ORDER BY views DESC
LIMIT 10;
```

### Example: Tour Completion Rate

```sql
-- Tour downloads
SELECT COUNT(*) as downloads
FROM analytics_events
WHERE event_type = 'tour_download_completed'
  AND properties->>'tour_id' = $1;

-- Tour completions
SELECT COUNT(*) as completions
FROM analytics_events
WHERE event_type = 'tour_completed'
  AND properties->>'tour_id' = $1;

-- Completion rate = completions / downloads * 100
```

---

## Success Criteria

- ✅ Dashboard displays overview statistics (users, tours, downloads, completions)
- ✅ Charts show trends over time (signups, active users)
- ✅ Date range selector works and filters data correctly
- ✅ Top tours table shows most popular tours
- ✅ Tour-specific analytics page shows detailed metrics
- ✅ Point trigger statistics show engagement per point
- ✅ Export to CSV functionality works
- ✅ Dashboard loads within 2 seconds with cached data
- ✅ Mobile-responsive design
- ✅ Error handling for missing data
- ✅ Loading states during data fetch

---

## Dependencies

**Backend:**
- No new dependencies needed (use Prisma/TypeORM for queries)
- Optional: `fast-csv` for CSV generation
- Optional: `@nestjs/cache-manager` for caching

**Frontend:**
```bash
npm install recharts          # Charts library
npm install date-fns          # Date manipulation
npm install react-datepicker  # Date range picker (optional)
```

---

## Performance Considerations

### 1. Database Optimization
- Add indexes on commonly queried fields:
  - `analytics_events.event_type`
  - `analytics_events.created_at`
  - `analytics_events.user_id`
  - `analytics_events(properties->>'tour_id')` (GIN index for JSONB)

```sql
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_tour_id ON analytics_events USING GIN ((properties->'tour_id'));
```

### 2. Caching Strategy
- Cache expensive aggregation queries for 5-15 minutes
- Use Redis for cache storage (optional)
- Invalidate cache when new events arrive (or accept slight delay)

### 3. Query Optimization
- Use materialized views for complex aggregations
- Pre-compute daily/weekly statistics with cron job
- Limit data ranges for large datasets (default to last 90 days)

---

## Testing Checklist

### Backend Testing
- [ ] Overview stats endpoint returns correct data
- [ ] Tour analytics endpoint filters by tour ID
- [ ] User stats endpoint aggregates correctly
- [ ] Voucher stats endpoint shows redemptions
- [ ] Date range filtering works across all endpoints
- [ ] CSV export generates valid CSV
- [ ] Endpoints handle missing data gracefully
- [ ] Query performance is acceptable (< 1 second for most queries)

### Frontend Testing
- [ ] Dashboard loads and displays stats
- [ ] Charts render correctly with data
- [ ] Date range selector updates data
- [ ] Top tours table shows correct rankings
- [ ] Tour detail page shows per-tour metrics
- [ ] Export button downloads CSV file
- [ ] Loading states appear during fetch
- [ ] Error messages display on failures
- [ ] Responsive design works on mobile/tablet
- [ ] Empty states show when no data available

---

## Timeline Estimate

| Task | Time |
|------|------|
| Backend analytics service | 2-3 hours |
| Backend analytics controller | 1 hour |
| Backend DTOs and validation | 30 min |
| Frontend API client | 30 min |
| Dashboard page with stat cards | 2 hours |
| Date range selector | 1 hour |
| Charts setup (Recharts) | 2-3 hours |
| Top tours table | 1 hour |
| Tour detail analytics page | 2 hours |
| Export functionality | 1 hour |
| Testing and polish | 1-2 hours |
| **Total** | **13-16 hours** |

---

## Optional Enhancements (Future)

These features can be added later if needed:

1. **Real-time Dashboard**
   - Use WebSockets to stream live events
   - Auto-refresh statistics every 30 seconds

2. **Advanced Filters**
   - Filter by language
   - Filter by user demographics
   - Filter by device type (iOS, Android)

3. **Heatmaps**
   - Geographic heatmap of user activity
   - Time-of-day heatmap for tour starts

4. **Cohort Analysis**
   - Track user retention over time
   - Compare user cohorts by signup date

5. **Email Reports**
   - Schedule weekly/monthly analytics emails
   - PDF reports with charts

6. **Alerts**
   - Set up alerts for unusual activity
   - Notify when tour completions drop below threshold

7. **A/B Testing**
   - Test different tour descriptions
   - Track conversion rates

---

## Notes

- Analytics data should be anonymized for GDPR compliance
- Consider data retention policy (delete events older than X days/years)
- Ensure analytics queries don't slow down main app performance
- Cache results aggressively for better UX
- Start simple, add complexity as needed
- Focus on actionable metrics (completion rate, engagement) over vanity metrics

---

**Status:** 📝 Planning Complete - Ready to Begin Implementation
**Next Step:** Start with backend analytics service and controller
