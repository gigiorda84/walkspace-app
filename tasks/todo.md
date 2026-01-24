# Task: Add Difficulty Field to Tours

## Requirements
- Add "difficoltà" (difficulty) field with three options: Facile/Medio/Difficile
- Display in CMS Tour Settings (similar to Duration/Distance)
- Display in mobile app TourDetailView as third InfoBadge
- Default value: "Facile" for all tours

## Tasks

### Backend
- [x] 1. Add `defaultDifficulty` field to Prisma schema with default "facile"
- [x] 2. Database column added via SQL (run `npx prisma generate` to sync client)
- [x] 3. Add to CreateTourDto and UpdateTourDto
- [x] 4. Add to TourListItemDto and TourDetailDto
- [x] 5. Update tours.service.ts to include difficulty in responses

### CMS
- [x] 6. Add difficulty dropdown to tour creation form (new/page.tsx)
- [x] 7. Add difficulty dropdown to tour editor (edit/page.tsx)

### Mobile App
- [x] 8. Add `difficulty` to Tour model
- [x] 9. Add `difficulty` to TourDetailResponse model
- [x] 10. Add InfoBadge for difficulty in TourDetailView

## Files Changed
- `backend/prisma/schema.prisma` - Added defaultDifficulty field
- `backend/src/admin/tours/dto/create-tour.dto.ts` - Added defaultDifficulty with validation
- `backend/src/admin/tours/dto/update-tour.dto.ts` - Added defaultDifficulty with validation
- `backend/src/tours/dto/tour-list.dto.ts` - Added difficulty field
- `backend/src/tours/dto/tour-detail.dto.ts` - Added difficulty field
- `backend/src/tours/tours.service.ts` - Added difficulty to listTours and getTourDetails
- `cms/src/app/tours/new/page.tsx` - Added difficulty dropdown (3-column grid)
- `cms/src/app/tours/[id]/edit/page.tsx` - Added difficulty dropdown with auto-save
- `mobile-app/ios/.../Models/Tour.swift` - Added difficultyRaw, displayDifficulty, updated decoder/encoder
- `mobile-app/ios/.../Models/TourDetailResponse.swift` - Added difficulty field
- `mobile-app/ios/.../Views/TourDetail/TourDetailView.swift` - Added InfoBadge with figure.walk icon

---

## Review

### Summary
Added "Difficulty" field across the full stack:
- **Backend**: Stored as `default_difficulty` in DB, exposed as `difficulty` in API responses
- **CMS**: Dropdown with Facile/Medio/Difficile options in both create and edit forms
- **Mobile**: Displayed as third InfoBadge with walking figure icon

### Migration Applied
Database column added via direct SQL. Run this to sync Prisma client:
```bash
cd backend && npx prisma generate
```

### Default Value
All existing tours will get `"facile"` as default difficulty (defined in Prisma schema).

### Display
- CMS: Dropdown showing "Facile", "Medio", "Difficile"
- Mobile: InfoBadge showing capitalized value (e.g., "Facile")

### Bug Fixes (2026-01-24)
Fixed CMS "Failed to load tours" error caused by missing `defaultDifficulty`:

1. **CMS TypeScript type** - Added `defaultDifficulty` to `Tour` interface in `cms/src/types/api/index.ts`
2. **Admin DTOs** - Added `defaultDifficulty` to `AdminTourListItemDto` and `AdminTourResponseDto`
3. **Admin Service** - Added `defaultDifficulty` to all response mappings in `admin-tours.service.ts`
4. **Database Migration** - Created `prisma/migrations/20260124000000_add_default_difficulty/migration.sql` to add column to production database
