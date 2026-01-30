# Backend & CMS Deployment Plan

**Goal:** Deploy both the backend API and CMS to production environments

**Date:** January 6, 2026

---

## Overview

We'll deploy:
1. **Backend (NestJS)** - API server with PostgreSQL database
2. **CMS (Next.js)** - Web-based content management system

## Architecture Decision

### Recommended Deployment Stack

**Backend:**
- **Hosting:** Railway or Render (automatic deployments, easy scaling)
- **Database:** Managed PostgreSQL (same provider for simplicity)
- **File Storage:** AWS S3 or Cloudflare R2 (for uploads/media)

**CMS:**
- **Hosting:** Vercel (optimized for Next.js, free tier available)

**Why this stack:**
- Railway/Render handle Node.js apps well with minimal config
- Managed PostgreSQL eliminates DB maintenance overhead
- Vercel is purpose-built for Next.js
- All platforms have free/affordable tiers for MVP

---

## Todo List

### Phase 1: Pre-Deployment Preparation

#### Task 1: Backend - Production Configuration
- [ ] Add production build script verification in package.json
- [ ] Create/verify .dockerignore file (exclude node_modules, .env, uploads)
- [ ] Update CORS configuration to allow production CMS domain
- [ ] Add production-ready logging (consider Winston or Pino)
- [ ] Verify all sensitive data uses environment variables
- [ ] Add health check endpoint (already exists at /health)
- [ ] Test production build locally (`npm run build && npm run start:prod`)

#### Task 2: Backend - Database Migration Strategy
- [ ] Verify all Prisma migrations are committed to git
- [ ] Test migration execution on fresh database
- [ ] Create database seeding script for initial data (if needed)
- [ ] Document migration rollback procedure
- [ ] Plan for zero-downtime deployments (if needed)

#### Task 3: Backend - File Storage Setup
- [ ] Choose cloud storage provider (AWS S3 / Cloudflare R2 / DigitalOcean Spaces)
- [ ] Create storage bucket with proper permissions
- [ ] Install storage SDK (e.g., @aws-sdk/client-s3)
- [ ] Update MediaService to use cloud storage instead of local uploads
- [ ] Implement signed URL generation for secure downloads
- [ ] Add environment variables for storage configuration
- [ ] Test file upload/download flow

#### Task 4: CMS - Production Configuration
- [ ] Verify production API URL environment variable
- [ ] Add production-ready error boundaries
- [ ] Configure proper CSP (Content Security Policy) headers
- [ ] Test production build locally (`npm run build && npm start`)
- [ ] Verify all API calls use environment variables
- [ ] Add analytics/monitoring setup (optional)

### Phase 2: Backend Deployment

#### Task 5: Database Deployment
- [ ] Create managed PostgreSQL instance (Railway/Render/Neon)
- [ ] Note database credentials (host, port, user, password, database name)
- [ ] Configure database for SSL connections
- [ ] Set up automated backups (daily minimum)
- [ ] Test connection from local machine
- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Verify schema is created correctly

#### Task 6: Backend Hosting Setup
- [ ] Create new project on Railway/Render
- [ ] Connect GitHub repository (main branch)
- [ ] Configure build command: `npm install && npm run build`
- [ ] Configure start command: `npm run start:prod`
- [ ] Set Node.js version (18 or 20)
- [ ] Configure auto-deploy on git push (optional)

#### Task 7: Backend Environment Variables
- [ ] Set NODE_ENV=production
- [ ] Set PORT (usually auto-assigned, or 3000)
- [ ] Set DATABASE_URL (from managed PostgreSQL)
- [ ] Set JWT_SECRET (generate strong random string)
- [ ] Set JWT_REFRESH_SECRET (generate strong random string)
- [ ] Set JWT_EXPIRES_IN (15m)
- [ ] Set JWT_REFRESH_EXPIRES_IN (7d)
- [ ] Set CORS_ORIGIN (production CMS URL)
- [ ] Set storage credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, etc.)
- [ ] Set UPLOAD_PATH (cloud storage bucket name)
- [ ] Set MAX_FILE_SIZE=52428800

#### Task 8: Backend Initial Deployment
- [ ] Trigger first deployment
- [ ] Monitor build logs for errors
- [ ] Verify deployment succeeded
- [ ] Note production API URL (e.g., https://api.walkspace.com)
- [ ] Test /health endpoint
- [ ] Test basic API endpoints (GET /tours, etc.)
- [ ] Monitor application logs for errors

### Phase 3: CMS Deployment

#### Task 9: CMS - Vercel Setup
- [ ] Create Vercel account (if not exists)
- [ ] Import CMS repository to Vercel
- [ ] Configure root directory as `cms/`
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `.next`
- [ ] Set Node.js version (18 or 20)

#### Task 10: CMS - Environment Variables
- [ ] Set NEXT_PUBLIC_API_URL (production backend URL from Task 8)
- [ ] Set NEXT_PUBLIC_APP_NAME=BANDITE CMS
- [ ] Set NEXT_PUBLIC_APP_VERSION=1.0.0
- [ ] Add any additional Next.js environment variables

#### Task 11: CMS Initial Deployment
- [ ] Trigger first deployment
- [ ] Monitor build logs for errors
- [ ] Verify deployment succeeded
- [ ] Note production CMS URL (e.g., https://cms.walkspace.com)
- [ ] Test CMS loads correctly
- [ ] Test authentication flow (if implemented)
- [ ] Test API integration (tours list, media upload, etc.)

### Phase 4: Post-Deployment Configuration

#### Task 12: Domain Configuration (Optional)
- [ ] Purchase domain names (if needed)
- [ ] Configure DNS for backend (api.walkspace.com)
- [ ] Configure DNS for CMS (cms.walkspace.com)
- [ ] Add custom domains in Railway/Render
- [ ] Add custom domain in Vercel
- [ ] Wait for SSL certificates to provision
- [ ] Update CORS_ORIGIN with custom domain
- [ ] Update NEXT_PUBLIC_API_URL with custom domain

#### Task 13: Security Hardening
- [ ] Enable HTTPS-only (should be default)
- [ ] Configure rate limiting (NestJS throttler)
- [ ] Review CORS configuration
- [ ] Set secure HTTP headers (helmet middleware)
- [ ] Enable database connection pooling
- [ ] Set up database firewall rules (allow only backend IP)
- [ ] Review file upload size limits
- [ ] Add API authentication for all protected endpoints

#### Task 14: Monitoring & Alerts
- [ ] Set up application monitoring (Railway/Render built-in or external)
- [ ] Configure error tracking (Sentry, LogRocket, etc.)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Configure alerting for downtime
- [ ] Monitor database performance metrics
- [ ] Set up log aggregation (if needed)

### Phase 5: Testing & Validation

#### Task 15: End-to-End Testing
- [ ] Test complete tour creation flow from CMS
- [ ] Test media upload and retrieval
- [ ] Test mobile app integration (if ready)
- [ ] Test voucher creation and validation
- [ ] Verify all API endpoints work correctly
- [ ] Test error handling and edge cases
- [ ] Verify data persistence across deployments
- [ ] Load test critical endpoints

#### Task 16: Documentation & Handoff
- [ ] Document production URLs and credentials (secure storage)
- [ ] Create deployment runbook for future updates
- [ ] Document rollback procedure
- [ ] Create backup/restore procedure
- [ ] Document environment variables reference
- [ ] Add deployment status badge to README (optional)
- [ ] Share credentials with team securely

---

## Environment Variables Reference

### Backend (.env for production)

```bash
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public&sslmode=require"

# JWT Authentication
JWT_SECRET=<generate-strong-random-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<generate-different-strong-random-secret>
JWT_REFRESH_EXPIRES_IN=7d

# File Storage (S3/R2/Spaces)
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_REGION=us-east-1
AWS_S3_BUCKET=walkspace-media
UPLOAD_PATH=walkspace-media
MAX_FILE_SIZE=52428800

# CORS
CORS_ORIGIN=https://cms.walkspace.com

# Optional
SENTRY_DSN=<sentry-project-dsn>
LOG_LEVEL=info
```

### CMS (.env.production for Vercel)

```bash
NEXT_PUBLIC_API_URL=https://api.walkspace.com
NEXT_PUBLIC_APP_NAME=BANDITE CMS
NEXT_PUBLIC_APP_VERSION=1.0.0
```

---

## Deployment Commands Quick Reference

### Backend (Railway/Render)
```bash
# Build
npm install
npm run build

# Start
npm run start:prod

# Migrations
npx prisma migrate deploy
npx prisma generate
```

### CMS (Vercel)
```bash
# Build
npm install
npm run build

# Start
npm start
```

---

## Cost Estimates (Monthly)

### Option 1: Railway (All-in-one)
- **Backend hosting:** $5-10 (starter plan)
- **PostgreSQL:** Included or $5
- **Total:** ~$10-15/month

### Option 2: Render
- **Backend hosting:** $7 (starter plan)
- **PostgreSQL:** $7 (starter plan)
- **Total:** ~$14/month

### Option 3: Mix & Match
- **Backend:** Railway $5
- **Database:** Neon (free tier) or Supabase (free tier)
- **Total:** ~$5/month (during development)

### Storage (All options)
- **AWS S3:** ~$0.023/GB + requests (typically $1-5/month)
- **Cloudflare R2:** Free tier 10GB, then $0.015/GB
- **Vercel:** Free for CMS

**Recommended for MVP:** Railway + Neon (PostgreSQL) + Cloudflare R2 + Vercel = ~$5-10/month

---

## Rollback Plan

If deployment fails:

1. **Backend issues:**
   - Revert to previous deployment in Railway/Render dashboard
   - Check logs for errors
   - Verify environment variables
   - Test database connection

2. **Database issues:**
   - Restore from automated backup
   - Rollback migrations: Create down migration if needed
   - Verify data integrity

3. **CMS issues:**
   - Revert to previous deployment in Vercel dashboard
   - Check build logs
   - Verify API URL environment variable

---

## Success Criteria

✅ Backend API is accessible and healthy
✅ Database migrations completed successfully
✅ File uploads work to cloud storage
✅ CMS loads and connects to backend API
✅ All critical API endpoints respond correctly
✅ SSL certificates are active (HTTPS)
✅ Monitoring and alerts are configured
✅ Documentation is complete
✅ Team can access production systems

---

## Review Section

(To be filled after deployment is complete)

### Summary
[Deployment summary will be added here]

### Issues Encountered
[Any problems and how they were resolved]

### Final URLs
- Backend API: [URL]
- CMS: [URL]
- Database: [Connection details]

### Next Steps
[Future improvements or pending tasks]
