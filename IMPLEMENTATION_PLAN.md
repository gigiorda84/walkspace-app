# Implementation Plan - Walkspace App

## Overview

This document outlines the step-by-step implementation plan for building the BANDITE Sonic Walkscape application. The plan follows a bottom-up approach, starting with foundational infrastructure and building towards the complete user-facing application.

## Guiding Principles

1. **Start with the backend** - Foundation for both CMS and mobile app
2. **Build iteratively** - Each phase produces working, testable components
3. **Keep it simple** - Minimal viable implementation at each step
4. **Test continuously** - Validate each component before moving forward
5. **Document as you go** - Keep API docs and setup instructions current

---

## Phase 0: Project Setup & Foundation

### Step 0.1: Repository Structure Setup ✅
- [x] Create GitHub repository
- [x] Add PRD and CLAUDE.md documentation
- [x] Create .gitignore

### Step 0.2: Monorepo Structure Decision
**Decision needed:** Should we use a monorepo or separate repositories?

**Option A: Monorepo (Recommended)**
```
walkspace-app/
├── backend/           # NestJS API
├── cms/              # Next.js CMS
├── mobile/           # iOS app (future)
├── shared/           # Shared types/constants
└── docs/             # Documentation
```

**Option B: Multi-repo**
- `walkspace-backend`
- `walkspace-cms`
- `walkspace-ios`

**Recommendation:** Start with **Option A (Monorepo)** for easier development and shared code.

---

## Phase 1: Backend Foundation

### Step 1.1: Backend Project Initialization 🎯 **FIRST STEP**

**Goal:** Set up a working NestJS backend with basic project structure.

**What we'll create:**
1. Initialize NestJS project in `backend/` directory
2. Set up TypeScript configuration
3. Configure PostgreSQL connection (local dev)
4. Set up environment variables (.env)
5. Create basic project structure:
   ```
   backend/
   ├── src/
   │   ├── auth/           # Auth module
   │   ├── tours/          # Tours module
   │   ├── users/          # Users module
   │   ├── media/          # Media module
   │   ├── vouchers/       # Vouchers module
   │   ├── analytics/      # Analytics module
   │   ├── common/         # Shared utilities
   │   ├── app.module.ts
   │   └── main.ts
   ├── prisma/             # Database schema
   ├── .env.example
   ├── package.json
   └── tsconfig.json
   ```

**Success criteria:**
- ✅ Backend server runs on http://localhost:3000
- ✅ PostgreSQL connection successful
- ✅ Health check endpoint responds: `GET /health`
- ✅ Basic logging works
- ✅ Environment variables load correctly

**Commands to implement:**
```bash
# From project root
npm create nest-app backend
cd backend
npm install @nestjs/config @nestjs/typeorm typeorm pg
npm install -D @types/node

# Start development server
npm run start:dev
```

**Time estimate:** 1-2 hours

---

### Step 1.2: Database Schema Setup

**Goal:** Create initial PostgreSQL schema using Prisma/TypeORM.

**What we'll create:**
1. Install Prisma
2. Create schema for core tables:
   - `users`
   - `tours`
   - `tour_versions`
   - `tour_points`
   - `tour_point_localizations`
   - `media_files`
3. Run initial migration
4. Seed database with test data

**Success criteria:**
- ✅ Schema matches PRD data model (Section 11)
- ✅ Migrations run successfully
- ✅ Can query database from backend

**Time estimate:** 2-3 hours

---

### Step 1.3: Authentication System

**Goal:** Implement JWT-based authentication with email/password.

**What we'll create:**
1. Auth module with endpoints:
   - `POST /auth/register`
   - `POST /auth/login`
   - `POST /auth/refresh`
2. JWT strategy with passport
3. Auth guards and decorators
4. Password hashing (bcrypt)

**Success criteria:**
- ✅ Users can register with email/password
- ✅ Users can login and receive JWT tokens
- ✅ Protected endpoints reject unauthorized requests
- ✅ Tokens can be refreshed

**Time estimate:** 3-4 hours

---

### Step 1.4: Tours API (Read-Only)

**Goal:** Implement basic tours listing and details endpoints.

**What we'll create:**
1. Tours module with endpoints:
   - `GET /tours` - List all tours
   - `GET /tours/:id` - Tour details
   - `GET /tours/:id/points` - Tour points
2. DTOs for request/response
3. Basic query filtering (language, city)

**Success criteria:**
- ✅ Can fetch tours list
- ✅ Can fetch tour details with language parameter
- ✅ Returns data matching PRD API spec (Section 10.3)

**Time estimate:** 2-3 hours

---

### Step 1.5: Media Storage Setup

**Goal:** Configure object storage for audio/images/subtitles.

**What we'll create:**
1. Choose storage provider:
   - Local filesystem (development)
   - AWS S3 / Cloudflare R2 (production)
2. Media upload endpoint: `POST /admin/media/upload`
3. Signed URL generation for downloads
4. File validation (size, type)

**Success criteria:**
- ✅ Can upload files via API
- ✅ Files stored with unique IDs
- ✅ Can generate signed download URLs
- ✅ File size limits enforced (50MB for audio)

**Time estimate:** 3-4 hours

---

### Step 1.6: Tour Manifest API

**Goal:** Implement download manifest endpoint for mobile app.

**What we'll create:**
1. Endpoint: `GET /tours/:id/manifest?language=it`
2. Returns all media URLs for offline download
3. Include map tile information
4. Version tracking for updates

**Success criteria:**
- ✅ Returns complete manifest (audio, images, subtitles, map)
- ✅ All URLs are signed and valid
- ✅ Matches PRD spec (Section 10.3)

**Time estimate:** 2 hours

---

### Step 1.7: Voucher System

**Goal:** Implement voucher validation API.

**What we'll create:**
1. Vouchers module with endpoints:
   - `POST /vouchers/validate`
2. Voucher validation logic (expiry, max uses)
3. User access grant on redemption

**Success criteria:**
- ✅ Can validate voucher codes
- ✅ Tracks redemptions
- ✅ Prevents over-use
- ✅ Grants user access to tours

**Time estimate:** 2-3 hours

---

### Step 1.8: Analytics Ingestion

**Goal:** Implement analytics event collection.

**What we'll create:**
1. Analytics module with endpoint:
   - `POST /analytics/events` (batch)
2. Event validation and storage
3. Basic event types from PRD

**Success criteria:**
- ✅ Can receive batch events
- ✅ Events stored in database
- ✅ Ready for future dashboard queries

**Time estimate:** 2 hours

---

## Phase 2: CMS Development

### Step 2.1: CMS Project Setup
- Initialize Next.js project in `cms/` directory
- Set up authentication (CMS users)
- Create basic layout and navigation

### Step 2.2: Tour Management UI
- Tours list page
- Create/edit tour form
- Tour versioning UI
- Publish/draft controls

### Step 2.3: Map-Based Route Editor
- Integrate Mapbox/MapLibre
- Draw route polyline
- Add/edit points on map
- Set trigger radii

### Step 2.4: Content Management
- Audio upload interface
- Image upload interface
- Subtitle upload (.srt)
- Multilingual text fields

### Step 2.5: Voucher Management
- Voucher batch creation
- Code generation
- Redemption tracking view

### Step 2.6: Analytics Dashboard
- Tour statistics view
- Language usage charts
- Export to CSV

---

## Phase 3: iOS App Development

### Step 3.1: iOS Project Setup
- Create Xcode project
- Set up SwiftUI structure
- Configure dependencies (Mapbox, networking)

### Step 3.2: Authentication Flow
- Login/register screens
- Apple Sign-In integration
- Token management

### Step 3.3: Tour Catalog
- Tours list view
- Tour detail view
- Language selection

### Step 3.4: Download Manager
- Download queue implementation
- Progress tracking
- Offline storage management

### Step 3.5: GPS & Geofencing
- CoreLocation setup
- Background location permissions
- Geofence monitoring
- Sequential triggering logic

### Step 3.6: Audio Player
- AVAudioPlayer integration
- Background playback
- Lock screen controls
- Subtitle synchronization

### Step 3.7: Map View
- Mapbox integration
- Route display
- User position tracking
- Offline maps

---

## Phase 4: Infrastructure & DevOps

### Step 4.1: Hosting Setup
- Choose hosting provider (Railway, Render, AWS)
- Set up production database
- Configure object storage (S3/R2)

### Step 4.2: CI/CD Pipeline
- GitHub Actions for backend tests
- Automated deployment
- Database migrations on deploy

### Step 4.3: Monitoring & Logging
- Error tracking (Sentry)
- Application monitoring
- Log aggregation

---

## Phase 5: Testing & Launch Preparation

### Step 5.1: Backend Testing
- Unit tests for critical logic
- Integration tests for APIs
- Load testing

### Step 5.2: CMS Testing
- E2E tests for key workflows
- Cross-browser testing

### Step 5.3: iOS Testing
- Unit tests
- UI tests
- TestFlight beta testing

### Step 5.4: Field Testing
- GPS accuracy testing in real locations
- Battery usage profiling
- Offline reliability testing

---

## Technology Stack Summary

### Backend
- **Framework:** NestJS + TypeScript
- **Database:** PostgreSQL 14+
- **ORM:** Prisma (recommended) or TypeORM
- **Auth:** Passport + JWT + bcrypt
- **Storage:** AWS S3 / Cloudflare R2
- **Maps:** Mapbox API for tile generation

### CMS
- **Framework:** Next.js 14+ (App Router)
- **UI:** TailwindCSS + shadcn/ui
- **Maps:** Mapbox GL JS
- **Forms:** React Hook Form + Zod
- **State:** React Query

### iOS
- **Language:** Swift 5.9+
- **UI:** SwiftUI
- **Maps:** Mapbox iOS SDK
- **Networking:** URLSession + async/await
- **Storage:** Core Data / FileManager

### Infrastructure
- **Hosting:** Railway / Render / AWS
- **Object Storage:** AWS S3 / Cloudflare R2
- **Auth Provider:** Consider Firebase Auth or Auth0 for social login
- **Analytics:** Mixpanel or self-hosted
- **Monitoring:** Sentry

---

## Next Steps

The immediate next step is **Phase 1, Step 1.1: Backend Project Initialization**.

This involves:
1. Creating the backend directory structure
2. Initializing a NestJS project
3. Setting up PostgreSQL locally
4. Creating a health check endpoint
5. Verifying the development server runs successfully

Once this foundation is in place, we can proceed with building out the authentication, database schema, and API endpoints in subsequent steps.

---

## Questions for Review

1. **Monorepo vs Multi-repo:** Do you prefer a monorepo structure or separate repositories?
2. **Database:** Do you have PostgreSQL installed locally, or should we use Docker?
3. **Object Storage:** For development, should we start with local filesystem or set up S3/R2 immediately?
4. **Auth Provider:** Should we implement custom JWT auth first, or integrate Firebase/Auth0 from the start?
5. **Scope:** Should we build the complete backend before starting the CMS, or alternate between them?
