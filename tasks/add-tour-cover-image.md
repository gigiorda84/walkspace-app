# Add Tour Cover Image Field

## Goal
Add a cover image field to the tour editor that appears after the tour title and description.

## Analysis
- Backend already supports `coverImageFileId` in the TourVersion model
- Backend DTOs already include this field (create-tour.dto.ts, update-tour.dto.ts, admin-tour-response.dto.ts)
- CMS TypeScript types need to be updated
- UI needs to be added to the tour edit page

## Todo Items
- [ ] Update CMS TypeScript types to include `coverImageFileId` in TourVersion interface
- [ ] Add `coverImageFileId` to version content state in the edit page
- [ ] Add UI for selecting/displaying the cover image after the description
- [ ] Wire up media browser modal for selecting the cover image
- [ ] Update version mutation to include coverImageFileId
- [ ] Test the functionality

## Files to Modify
1. `cms/src/types/api/index.ts` - Add coverImageFileId field
2. `cms/src/app/tours/[id]/edit/page.tsx` - Add UI and state management
3. `cms/src/lib/api/versions.ts` - Ensure API calls include the field

## Implementation Notes
- Keep changes minimal and simple
- Only impact necessary code
- Follow existing patterns for media file selection
- Use the same MediaBrowserModal component already in use for point images
