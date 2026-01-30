# Phase 6: Point Localizations & Content - Completion Plan

## Current Status

**Already Implemented ✅:**
- Point localizations page (`/tours/[id]/points/[pointId]/localizations`)
  - Version selector with language tabs
  - Form for title and description
  - Fields for audio, image, subtitle file IDs
  - Create/update functionality
  - Visual indicators for configured localizations
- API client (`pointLocalizationsApi`)
  - All CRUD methods implemented
- Backend endpoints (mostly complete)
  - ✅ `POST /admin/tours/:tourId/points/:pointId/localizations` - Create
  - ✅ `PATCH /admin/tours/:tourId/points/:pointId/localizations/:localizationId` - Update
  - ✅ `DELETE /admin/tours/:tourId/points/:pointId/localizations/:localizationId` - Delete
  - ❌ `GET /admin/tours/:tourId/points/:pointId/localizations` - **MISSING**

**Missing ✗:**
1. Backend GET endpoint to list localizations for a point
2. Better UX for file selection (currently uses text input for file IDs)
3. Testing

---

## Tasks

### 1. Add GET Localizations Endpoint to Backend

**Problem:** The CMS calls `GET /admin/tours/:tourId/points/:pointId/localizations` to fetch all localizations for a point, but this endpoint doesn't exist.

**Current Workaround:** Localizations are returned as part of `GET /admin/tours/:tourId/points/:pointId`, but the CMS needs a dedicated endpoint.

**Solution:** Add a GET endpoint for localizations.

**Files to modify:**
- `backend/src/admin/tours/admin-tours.controller.ts` - Add GET endpoint
- `backend/src/admin/tours/admin-tours.service.ts` - Add getLocalizationsByPoint method

**Steps:**
- [ ] Add `getLocalizationsByPoint` method to AdminToursService
- [ ] Add `GET /:tourId/points/:pointId/localizations` endpoint to AdminToursController
- [ ] Test the endpoint

---

### 2. Improve File Selection UX (Optional Enhancement)

Currently, the localization form uses text input fields for file IDs, which requires users to manually copy IDs from the media library.

**Better approach:**
- [ ] Add file browser/picker modal
- [ ] Show file preview (thumbnail for images, waveform for audio)
- [ ] Allow uploading files inline

**Decision:** This can be deferred to Phase 7 (Media Upload & Management) since we'll be building a comprehensive media library then. For now, the text input approach works.

---

### 3. Test Localizations Features

Once the GET endpoint is added:

- [ ] Navigate to a tour point
- [ ] Access localizations page
- [ ] Select a language version
- [ ] Create localization with title and description
- [ ] Verify it saves correctly
- [ ] Switch to another language
- [ ] Create another localization
- [ ] Update existing localization
- [ ] Verify "Configured" badges appear
- [ ] Test with file IDs (if media exists)

---

### 4. Mark Phase 6 as Complete

- [ ] Update `tasks/todo.md` to mark all Phase 6 tasks as complete
- [ ] Add review section with summary of changes

---

## Implementation Details

### GET Localizations Method (AdminToursService)

```typescript
async getLocalizationsByPoint(tourId: string, pointId: string): Promise<LocalizationResponseDto[]> {
  // Verify point exists and belongs to tour
  const point = await this.prisma.tourPoint.findUnique({
    where: { id: pointId },
    include: {
      tour: true,
    },
  });

  if (!point) {
    throw new NotFoundException('Point not found');
  }

  if (point.tourId !== tourId) {
    throw new BadRequestException('Point does not belong to this tour');
  }

  const localizations = await this.prisma.tourPointLocalization.findMany({
    where: { tourPointId: pointId },
    orderBy: { createdAt: 'asc' },
  });

  return localizations.map((loc) => ({
    id: loc.id,
    tourPointId: loc.tourPointId,
    tourVersionId: loc.tourVersionId,
    language: loc.language,
    title: loc.title,
    description: loc.description,
    audioFileId: loc.audioFileId,
    imageFileId: loc.imageFileId,
    subtitleFileId: loc.subtitleFileId,
    createdAt: loc.createdAt,
  }));
}
```

### GET Localizations Endpoint (AdminToursController)

```typescript
@Get(':tourId/points/:pointId/localizations')
@ApiOperation({
  summary: '[CMS] Get point localizations',
  description: 'Get all localizations for a specific point across all languages.'
})
@ApiParam({ name: 'tourId', description: 'Tour ID (UUID)' })
@ApiParam({ name: 'pointId', description: 'Point ID (UUID)' })
@ApiResponse({
  status: 200,
  description: 'Localizations retrieved successfully',
  type: [LocalizationResponseDto]
})
@ApiResponse({
  status: 404,
  description: 'Point not found'
})
async getLocalizationsByPoint(
  @Param('tourId') tourId: string,
  @Param('pointId') pointId: string,
): Promise<LocalizationResponseDto[]> {
  return this.adminToursService.getLocalizationsByPoint(tourId, pointId);
}
```

---

## Success Criteria

- ✅ Can view all localizations for a point
- ✅ Can create localization for each language version
- ✅ Can update existing localizations
- ✅ Can delete localizations (not tested but endpoint exists)
- ✅ UI shows which languages have localizations configured
- ✅ Form handles create vs update correctly
- ✅ Backend validates point belongs to tour

---

## Notes

- The localization page is well-designed with good UX
- File selection will be improved in Phase 7 when we build the media library
- Backend already has comprehensive validation
- The page properly handles missing versions (shows message to create versions first)
