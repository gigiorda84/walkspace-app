# Walkspace Backend API

NestJS-based backend API for the Walkspace sonic walking tour application.

## Tech Stack

- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL
- **ORM:** Prisma 7
- **Auth:** JWT with Passport
- **Validation:** class-validator, class-transformer

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ running locally
- Git

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Create the PostgreSQL database:

```bash
createdb walkspace
```

### 3. Environment Variables

Copy the example env file:

```bash
cp .env.example .env
```

Update `.env` with your database credentials. Default configuration:

```
DATABASE_URL="postgresql://your_username@localhost:5432/walkspace?schema=public"
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev
```

This will:
- Apply the initial schema migration
- Generate the Prisma Client

### 5. Start Development Server

```bash
npm run start:dev
```

The server will start at `http://localhost:3000`

## Available Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check with database status

## Development

### Run in Dev Mode (with watch)

```bash
npm run start:dev
```

### Build for Production

```bash
npm run build
```

### Run in Production Mode

```bash
npm run start:prod
```

### Database Commands

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name description_of_change

# View database in Prisma Studio
npx prisma studio
```

## Project Structure

```
backend/
├── src/
│   ├── auth/           # Authentication module (JWT, passwords)
│   ├── tours/          # Tours CRUD and APIs
│   ├── users/          # User management
│   ├── media/          # File upload/storage
│   ├── vouchers/       # Voucher validation
│   ├── analytics/      # Event tracking
│   ├── common/         # Shared utilities
│   ├── app.module.ts   # Main application module
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── prisma.service.ts  # Database service
│   └── main.ts         # Application entry point
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── migrations/     # Migration history
├── prisma.config.ts    # Prisma configuration
└── .env                # Environment variables (not in git)
```

## Key Technologies

### Prisma 7

This project uses Prisma 7 with the PostgreSQL adapter. The database connection is configured in:
- `prisma.config.ts` - Datasource URL configuration
- `prisma/schema.prisma` - Data models
- `src/prisma.service.ts` - Prisma client service

### NestJS Modules

The application is organized into feature modules:
- Each module is self-contained
- Modules are imported in `app.module.ts`
- PrismaService is globally available

## Next Steps

See `IMPLEMENTATION_PLAN.md` in the project root for the complete development roadmap.

**Current Status:** ✅ Step 1.1 Complete - Backend foundation established

**Next:** Step 1.2 - Database Schema Setup (add remaining models from PRD)
# Force deploy Tue Jan 13 13:01:48 CET 2026
