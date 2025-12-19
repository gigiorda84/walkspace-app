# Backend Reliability & Scalability Plan

## Current Status ✅

**Backend:** Running successfully on http://localhost:3000
**Database:** PostgreSQL connected and healthy
**Recent Fixes:**
1. ✅ Edit Point API - Added field mappings (latitude/longitude aliases)
2. ✅ Point Localizations - Removed invalid tourVersionId field

---

## Root Cause Analysis: Why Backend Wasn't Starting

### Investigation Timeline
1. **Initial Problem:** Backend compiled but wouldn't bind to port 3000
2. **Discovery:** TypeScript build errors due to missing DTO fields
3. **Root Cause:** We added fields to service response but forgot to update DTO type definition
4. **Fix:** Updated `PointResponseDto` to include optional CMS-friendly fields
5. **Result:** Build succeeded, backend started successfully

### Why It's Working Now
- ✅ TypeScript compilation passes (no DTO mismatches)
- ✅ Prisma client properly generated
- ✅ Database connection working (`DATABASE_URL` valid)
- ✅ Port 3000 available (no conflicts)
- ✅ All NestJS modules loading correctly

---

## Backend Resilience Improvements Plan

### Phase 1: Immediate Diagnostic Improvements (High Priority)

#### 1.1 Add Startup Error Logging
**File:** `/backend/src/main.ts`
**Goal:** Catch and log ALL startup failures clearly

**Changes:**
```typescript
async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    // ... existing code ...
    await app.listen(process.env.PORT ?? 3000);
    console.log(`🚀 Server running on http://localhost:${process.env.PORT ?? 3000}`);
  } catch (error) {
    console.error('❌ FATAL: Failed to start backend server');
    console.error('Error details:', error);
    process.exit(1);
  }
}
bootstrap().catch((error) => {
  console.error('❌ FATAL: Bootstrap function failed');
  console.error('Error details:', error);
  process.exit(1);
});
```

**Why:** Silent failures make debugging impossible

---

#### 1.2 Add Database Connection Health Check
**File:** `/backend/src/app.module.ts` or create `/backend/src/health/health.module.ts`
**Goal:** Verify database connection on startup

**Approach:**
1. Add Prisma connection test in AppModule `onModuleInit()`
2. Log connection success/failure clearly
3. Fail fast if database unreachable

**Benefits:**
- Immediate feedback if PostgreSQL is down
- Clear error messages about connection string issues
- Prevent silent hangs waiting for DB

---

#### 1.3 Environment Variable Validation
**File:** Create `/backend/src/config/env.validation.ts`
**Goal:** Validate all required env vars on startup

**Required Variables:**
- `DATABASE_URL` - Must be valid PostgreSQL connection string
- `JWT_SECRET` - Must exist and be non-empty
- `JWT_REFRESH_SECRET` - Must exist and be non-empty
- `PORT` - Optional, defaults to 3000
- `CORS_ORIGIN` - Optional, defaults to http://localhost:3001

**Implementation:**
```typescript
import { plainToInstance } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET: string;

  @IsOptional()
  @IsString()
  PORT?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`❌ Environment validation failed:\n${errors.toString()}`);
  }

  return validatedConfig;
}
```

**Why:** Fail fast with clear message instead of mysterious runtime errors

---

### Phase 2: Development Experience Improvements (Medium Priority)

#### 2.1 Add Unified Start Script
**File:** `/backend/package.json`
**Goal:** Single command that handles all startup tasks

**Add script:**
```json
{
  "scripts": {
    "dev": "npm run prisma:generate && npm run build && npm run start:dev",
    "dev:fresh": "npm run prisma:generate && rm -rf dist && npm run build && npm run start:dev"
  }
}
```

**Why:** Ensures Prisma client is always up-to-date before starting

---

#### 2.2 Add Pre-flight Checks Script
**File:** Create `/backend/scripts/preflight.sh`
**Goal:** Check all prerequisites before starting

```bash
#!/bin/bash
set -e

echo "🔍 Running pre-flight checks..."

# Check PostgreSQL
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
  echo "❌ PostgreSQL is not running on localhost:5432"
  exit 1
fi
echo "✅ PostgreSQL is running"

# Check database exists
if ! psql -h localhost -U juicy -lqt | cut -d \| -f 1 | grep -qw walkspace; then
  echo "❌ Database 'walkspace' does not exist"
  echo "   Run: createdb walkspace"
  exit 1
fi
echo "✅ Database 'walkspace' exists"

# Check .env file
if [ ! -f .env ]; then
  echo "❌ .env file not found"
  echo "   Copy .env.example to .env and configure"
  exit 1
fi
echo "✅ .env file exists"

# Check node_modules
if [ ! -d node_modules ]; then
  echo "❌ node_modules not found"
  echo "   Run: npm install"
  exit 1
fi
echo "✅ node_modules exists"

echo "✅ All pre-flight checks passed"
```

**Usage:**
```json
{
  "scripts": {
    "prestart:dev": "bash scripts/preflight.sh"
  }
}
```

---

#### 2.3 Improve Build Error Reporting
**File:** `/backend/tsconfig.json`
**Goal:** Get clearer TypeScript error messages

**Add/modify:**
```json
{
  "compilerOptions": {
    "pretty": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Why:** Catch type errors earlier with better messages

---

### Phase 3: Monitoring & Observability (Low Priority, Future)

#### 3.1 Structured Logging
**Goal:** Replace console.log with proper logger (Winston/Pino)

**Benefits:**
- Log levels (debug, info, warn, error)
- Structured JSON output
- Log rotation
- Easy filtering

#### 3.2 Request Tracing
**Goal:** Track request flow through the system

**Implementation:**
- Add request ID middleware
- Log request ID on all operations
- Track slow queries

#### 3.3 Performance Monitoring
**Goal:** Track backend performance metrics

**Metrics to track:**
- Request duration
- Database query duration
- Memory usage
- Active connections

---

## Todo List

### Immediate (Do Now)
- [ ] 1.1 - Add startup error logging to main.ts
- [ ] 1.2 - Add database health check on startup
- [ ] 1.3 - Create environment variable validation
- [ ] Test backend restart with new error handling
- [ ] Document common startup errors and fixes

### Short Term (This Week)
- [ ] 2.1 - Add unified dev script to package.json
- [ ] 2.2 - Create pre-flight checks script
- [ ] 2.3 - Improve TypeScript strictness for better errors
- [ ] Add README section: "Troubleshooting Backend Issues"

### Long Term (Future Enhancements)
- [ ] 3.1 - Implement structured logging with Winston
- [ ] 3.2 - Add request tracing middleware
- [ ] 3.3 - Set up performance monitoring
- [ ] Add automated tests for startup sequence
- [ ] Add Docker Compose for consistent dev environment

---

## Common Failure Modes & Solutions

### Problem: "Cannot find module '@prisma/client'"
**Cause:** Prisma client not generated after schema changes
**Solution:** Run `npx prisma generate`

### Problem: "Port 3000 already in use"
**Cause:** Previous instance still running
**Solution:**
```bash
lsof -ti :3000 | xargs kill -9
```

### Problem: "Database connection failed"
**Cause:** PostgreSQL not running or wrong DATABASE_URL
**Solution:**
1. Check PostgreSQL: `pg_isready`
2. Verify DATABASE_URL in .env
3. Test connection: `psql <DATABASE_URL>`

### Problem: "TypeScript build errors"
**Cause:** Type mismatch between service and DTO
**Solution:**
1. Check DTO definitions match service responses
2. Run `npm run build` to see all errors
3. Fix type definitions before starting server

### Problem: "Module not found" errors
**Cause:** Missing dependencies or stale node_modules
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Testing Checklist for Changes

Before marking backend changes as complete:
- [ ] `npm run build` succeeds with no errors
- [ ] Backend starts and logs startup message
- [ ] Health endpoint returns 200: `curl http://localhost:3000/health`
- [ ] API docs accessible: http://localhost:3000/api/docs
- [ ] Test a CMS endpoint: `curl http://localhost:3000/admin/tours`
- [ ] Check logs for errors or warnings

---

## Review Section

### Changes Implemented ✅

#### Edit Point API Fix
**Files Modified:**
1. `/backend/src/admin/tours/admin-tours.service.ts` (lines 558-583)
2. `/backend/src/admin/tours/dto/point-response.dto.ts` (lines 13-28)

**Problem:** Frontend expected `{latitude, longitude, sequenceOrder, triggerRadiusMeters}` but backend returned `{lat, lng, order, defaultTriggerRadiusMeters}`

**Solution:** Return both field naming conventions for backwards compatibility

**Result:** ✅ API now returns both sets of fields, Edit Point page works

**Example Response:**
```json
{
  "id": "36ec77c0-da16-4a0e-a368-ee0e8e35a694",
  "order": 1,
  "lat": 41.90605789740962,
  "lng": 12.48730194702341,
  "defaultTriggerRadiusMeters": 150,
  "sequenceOrder": 1,
  "latitude": 41.90605789740962,
  "longitude": 12.48730194702341,
  "triggerRadiusMeters": 150
}
```

---

### Point Localizations Fix ✅

**File Modified:** `/cms/src/app/tours/[id]/points/[pointId]/localizations/page.tsx`

**Problem:** 400 Bad Request when creating localization (sending invalid `tourVersionId`)

**Solution:** Removed `tourVersionId` from payload, backend auto-links via language

**Result:** ✅ Verified working - 201 Created response, localization saved successfully

---

### Next Steps

**User Action Required:**
Choose which phase to implement:
- **Option A:** Phase 1 only (startup error logging & validation) - ~1 hour
- **Option B:** Phases 1 + 2 (add dev experience improvements) - ~2-3 hours
- **Option C:** Review plan, test current fixes, defer improvements

**Current Status:**
- Both critical bugs fixed and working
- Backend stable and running
- CMS stable on Next.js 15.1.3
- All features functional

**Recommendation:** Option A (Phase 1) - Add safety nets to prevent silent failures in future
