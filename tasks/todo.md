# Add Sessions List to CMS Analytics

## Tasks
- [x] 1. Backend DTO — Add `SessionItemDto` to `analytics-response.dto.ts`
- [x] 2. Backend Service — Add `getSessions(period)` method to `admin-analytics.service.ts`
- [x] 3. Backend Controller — Add `GET /admin/analytics/sessions` endpoint
- [x] 4. CMS Types — Add `SessionItem` interface to `cms/src/types/api/index.ts`
- [x] 5. CMS API Client — Add `getSessions()` to `analyticsApi` in `client.ts`
- [x] 6. CMS Analytics Page — Add "Recent Sessions" table to `page.tsx`

## Review

### Changes Summary
Added a "Recent Sessions" table to the CMS analytics page. Each `tour_started` event is treated as a session. The backend matches each start to its terminal event (`tour_completed`/`tour_abandoned`) and counts `point_triggered` events in between. No schema changes needed — everything is inferred from existing analytics events.

### Files Modified

| File | Change |
|------|--------|
| `backend/src/admin/analytics/dto/analytics-response.dto.ts` | Added `SessionItemDto` class (10 fields with Swagger decorators) |
| `backend/src/admin/analytics/admin-analytics.service.ts` | Added `getSessions()` method — 3 batch queries + in-memory matching |
| `backend/src/admin/analytics/admin-analytics.controller.ts` | Added `GET /admin/analytics/sessions?period=` endpoint |
| `cms/src/types/api/index.ts` | Added `SessionItem` TypeScript interface |
| `cms/src/lib/api/client.ts` | Added `getSessions()` to `analyticsApi` object |
| `cms/src/app/analytics/page.tsx` | Added sessions state, fetch in Promise.all, and "Recent Sessions" table with status badges |

### How it works
1. Backend fetches last 50 `tour_started` events (desc by date)
2. Batch-fetches all matching `tour_completed`/`tour_abandoned` and `point_triggered` events
3. For each start, finds the first terminal event (same anonymousId + tourId, after start time)
4. Status: `completed` / `abandoned` / `in-progress` (no terminal event found)
5. Duration comes from the terminal event's `properties.durationMinutes`
6. Points count = number of `point_triggered` events between start and end

### Edge cases handled
- No terminal event → status = "in-progress", duration shows "—"
- Missing device/osVersion → shows "—"
- Deleted tour → shows "Unknown Tour"
- No sessions at all → "No sessions found" empty state
