# Phase 8: Analytics Dashboard - TODO

## Status
- **Current Phase:** Phase 8 - Analytics Dashboard 📊
- **Previous Phases:** 1-7 Complete ✅
- **Timeline:** ~13-16 hours estimated

---

## Overview

Build a comprehensive analytics dashboard to track user engagement, tour performance, and voucher redemption metrics. This will provide content managers with insights into how their tours are performing.

**See detailed plan:** `tasks/phase-8-plan.md`

---

## Backend Tasks

### 1. Analytics Admin Service
- [ ] Create `admin-analytics.service.ts`
- [ ] Implement `getOverviewStats()` method
- [ ] Implement `getTourAnalytics()` method
- [ ] Implement `getUserActivityStats()` method
- [ ] Implement `getVoucherStats()` method
- [ ] Implement `getEvents()` method with filters
- [ ] Implement `exportAnalytics()` CSV export
- [ ] Add database indexes for performance
- [ ] Test all aggregation queries

### 2. Analytics Admin Controller
- [ ] Create `admin-analytics.controller.ts`
- [ ] Add `GET /admin/analytics/overview` endpoint
- [ ] Add `GET /admin/analytics/tours/:tourId` endpoint
- [ ] Add `GET /admin/analytics/users` endpoint
- [ ] Add `GET /admin/analytics/vouchers` endpoint
- [ ] Add `GET /admin/analytics/events` endpoint
- [ ] Add `GET /admin/analytics/export` endpoint
- [ ] Add role-based access control
- [ ] Test all endpoints with Postman

### 3. DTOs and Validation
- [ ] Create `OverviewStatsDto`
- [ ] Create `TourAnalyticsDto`
- [ ] Create `UserActivityStatsDto`
- [ ] Create `VoucherStatsDto`
- [ ] Create `EventFilterDto`
- [ ] Add validation decorators

---

## Frontend Tasks

### 1. Install Dependencies
- [ ] Install recharts for charts
- [ ] Install date-fns for date manipulation
- [ ] Review and test dependencies

### 2. Analytics API Client
- [ ] Create `cms/src/lib/api/analytics.ts`
- [ ] Add `getOverview()` method
- [ ] Add `getTourAnalytics()` method
- [ ] Add `getUserStats()` method
- [ ] Add `getVoucherStats()` method
- [ ] Add `getEvents()` method
- [ ] Add `exportAnalytics()` method
- [ ] Add TypeScript types
- [ ] Test API integration

### 3. Chart Components
- [ ] Create `LineChart.tsx` component
- [ ] Create `BarChart.tsx` component
- [ ] Create `PieChart.tsx` component
- [ ] Create `StatCard.tsx` component
- [ ] Style components with Tailwind
- [ ] Test with sample data

### 4. Analytics Dashboard Page (`/analytics`)
- [ ] Create page route
- [ ] Add StatCard components for overview metrics
- [ ] Add DateRangeSelector component
- [ ] Add LineChart for signups over time
- [ ] Add BarChart for active users
- [ ] Add TopToursTable component
- [ ] Add RecentActivityFeed component
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add empty states
- [ ] Test responsive design

### 5. Date Range Selector
- [ ] Create `DateRangeSelector.tsx`
- [ ] Add preset ranges (7d, 30d, 90d, All)
- [ ] Add custom date picker
- [ ] Update URL params
- [ ] Persist selection in localStorage
- [ ] Test date filtering

### 6. Export Functionality
- [ ] Create `ExportButton.tsx`
- [ ] Add CSV export button
- [ ] Show loading state during export
- [ ] Handle file download
- [ ] Add success/error notifications
- [ ] Test export with real data

### 7. Tour Analytics Detail Page (Optional)
- [ ] Create `/analytics/tours/[tourId]` page
- [ ] Add tour-specific metrics
- [ ] Add completion rate display
- [ ] Add point trigger statistics
- [ ] Add daily activity chart
- [ ] Test with multiple tours

---

## Testing

### Backend Testing
- [ ] Test overview stats endpoint
- [ ] Test tour analytics endpoint
- [ ] Test user stats endpoint
- [ ] Test voucher stats endpoint
- [ ] Test date range filtering
- [ ] Test CSV export format
- [ ] Verify query performance (< 1 sec)
- [ ] Test with large datasets

### Frontend Testing
- [ ] Test dashboard loads correctly
- [ ] Test charts render with data
- [ ] Test date range selector updates data
- [ ] Test top tours table
- [ ] Test export downloads CSV
- [ ] Test loading states
- [ ] Test error handling
- [ ] Test responsive design (mobile/tablet)
- [ ] Test empty states

### Integration Testing
- [ ] Test end-to-end data flow
- [ ] Verify analytics event ingestion works
- [ ] Test real-time data updates
- [ ] Verify all metrics calculate correctly

---

## Performance Optimization

- [ ] Add database indexes on analytics_events table
- [ ] Implement query caching (optional)
- [ ] Test dashboard load time (target < 2 sec)
- [ ] Optimize expensive aggregation queries
- [ ] Consider materialized views for complex stats

---

## Review
(To be completed after implementation)

---

## Notes
- Backend analytics_events table already exists ✅
- Event ingestion endpoint `POST /analytics/events` working ✅
- Focus on creating read endpoints for aggregated data
- Start simple with overview stats, add complexity later
- Cache results for better performance
- Ensure GDPR compliance (anonymized data)
- Consider data retention policy
