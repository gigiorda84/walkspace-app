# Point Editing Error Investigation - January 7, 2026

## User Report
Getting error when editing points: "Failed to save point content: property tourVersionId should not exist"
- URL: https://cms-nzfbmp0in-gigiordas-projects.vercel.app/tours/79fc42dc-c881-401f-8547-5de2c8215584/edit

## Current Status
- Previous fix (commit b89d6da) removed `tourVersionId` from CREATE payload
- Code appears correct - no tourVersionId in createPayload or basePayload
- But user is still experiencing the error

## Possible Causes
1. **Deployment not updated** - The Vercel deployment may not have the latest code
2. **Browser cache** - Old JavaScript bundle cached in browser
3. **UPDATE operation issue** - Error happening during UPDATE, not CREATE
4. **Type definition mismatch** - `Partial<TourPointLocalization>` type includes tourVersionId

## Investigation Plan
- [ ] Check if error occurs during CREATE or UPDATE
- [ ] Verify the updateLocalization function doesn't send tourVersionId
- [ ] Check the deployed version on Vercel
- [ ] Test locally to reproduce the issue

## Files to Review
- cms/src/lib/api/point-localizations.ts - API function
- cms/src/app/tours/[id]/edit/page.tsx - Mutation logic
- backend/src/admin/tours/dto/update-localization.dto.ts - Backend DTO
