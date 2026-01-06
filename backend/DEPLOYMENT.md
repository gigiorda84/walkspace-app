# Backend Deployment Guide

## Database Migrations

### Production Migration Command

**IMPORTANT:** In production, use `prisma migrate deploy` (NOT `prisma migrate dev`):

```bash
npx prisma migrate deploy
```

This command:
- ✅ Runs all pending migrations
- ✅ Does NOT create new migrations
- ✅ Does NOT prompt for confirmations
- ✅ Is safe for CI/CD pipelines
- ✅ Supports transactions (rollback on failure)

### Migration Strategy

1. **All migrations are committed to git**
   - Location: `prisma/migrations/`
   - 7 migrations currently tracked
   - Never modify existing migrations

2. **Deployment Process**
   ```bash
   # 1. Build the application
   npm install
   npm run build

   # 2. Run migrations (before starting app)
   npx prisma generate
   npx prisma migrate deploy

   # 3. Start the application
   npm run start:prod
   ```

3. **Rollback Procedure**
   - Prisma doesn't support automatic rollback
   - For rollback, deploy previous version of code
   - Manually create "down" migration if needed
   - Always backup database before major migrations

### Current Migrations

1. `20251205220758_init` - Initial schema
2. `20251205223029_add_complete_schema` - Complete domain model
3. `20251206082334_add_video_support_to_tours` - Video tours
4. `20251214170513_add_media_versioning` - Media versioning
5. `20251226153403_add_cover_image_to_tour_version` - Cover images
6. `20251230202552_add_completion_message` - Completion messages
7. `20260106101700_add_language_to_media_files` - Language field for media

### Production Database Setup

```bash
# 1. Create production database (managed PostgreSQL)
# 2. Get connection string with SSL enabled
# 3. Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://user:pass@host:5432/dbname?schema=public&sslmode=require"

# 4. Run migrations
npx prisma migrate deploy

# 5. Verify schema
npx prisma migrate status
```

### Seeding (Optional)

If you need initial data:

```bash
npm run prisma:seed
```

Or manually via Prisma Studio:

```bash
npx prisma studio
```

---

## Environment Variables

Required environment variables for production:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://..."
JWT_SECRET="<strong-random-secret>"
JWT_REFRESH_SECRET="<different-strong-random-secret>"
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN="https://cms.walkspace.com,https://app.walkspace.com"
MAX_FILE_SIZE=52428800
```

For cloud storage (S3/R2):
```bash
AWS_ACCESS_KEY_ID="<access-key>"
AWS_SECRET_ACCESS_KEY="<secret-key>"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="walkspace-media"
STORAGE_PROVIDER="s3"
```

---

## Health Checks

The API provides a health check endpoint:

```bash
GET /health
```

Response (healthy):
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  }
}
```

---

## Build Commands

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Build TypeScript
npm run build

# Start production server
npm run start:prod
```

---

## Monitoring

Monitor these metrics:
- API response times
- Database connection pool
- Memory usage
- Error rates
- Request volume

Use platform monitoring (Railway/Render) or external tools (Sentry, New Relic).

---

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
npx prisma db pull

# Check migration status
npx prisma migrate status

# Verify schema
npx prisma validate
```

### Migration Failures

1. Check migration logs
2. Verify DATABASE_URL is correct
3. Ensure database user has DDL permissions
4. Check for schema conflicts
5. Restore from backup if needed

### Build Failures

```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build
```
