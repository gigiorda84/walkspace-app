# Phase 5: Language Versions & Multilingual Content - Completion Plan

## Current Status

**Already Implemented ✅:**
- Tour versions list page (`/tours/[id]/versions`)
  - Displays all language variants (it, fr, en)
  - Shows status (draft/published)
  - Has publish/unpublish toggle buttons
  - Has delete functionality
  - Has edit links
- New version form (`/tours/[id]/versions/new`)
  - Language selection
  - Title and description fields
  - Status selection (draft/published)
  - Route copying from existing versions
  - Prevents duplicate language versions
- Version editor (`/tours/[id]/versions/[versionId]/edit`)
  - Edit title, description
  - Manage route polyline with map editor
  - Change status
- API integration
  - versionsApi service fully implemented
  - All CMS endpoints connected

**Missing ✗:**
1. Backend unpublish endpoint (CMS calls `/admin/tours/:tourId/versions/:versionId/unpublish` which doesn't exist)
2. Testing of all version features

---

## Tasks

### 1. Add Unpublish Endpoint to Backend

**Problem:** The CMS's `versionsApi.unpublishVersion()` calls `PATCH /admin/tours/:tourId/versions/:versionId/unpublish`, but the backend only has a `POST /admin/tours/:tourId/versions/:versionId/publish` endpoint that sets status to 'published'.

**Solution:** Add an unpublish endpoint to the backend.

**Files to modify:**
- `backend/src/admin/tours/admin-tours.controller.ts` - Add unpublish endpoint
- `backend/src/admin/tours/admin-tours.service.ts` - Add unpublishVersion method

**Steps:**
- [ ] Add `unpublishVersion` method to AdminToursService
- [ ] Add `POST /:tourId/versions/:versionId/unpublish` endpoint to AdminToursController
- [ ] Test the endpoint with curl or Postman

---

### 2. Test Version Management Features

Once the unpublish endpoint is added, test all version features:

- [ ] Navigate to an existing tour
- [ ] Create a new version (Italian)
  - [ ] Verify it appears in the list
  - [ ] Verify status is draft/published as selected
- [ ] Edit the version
  - [ ] Change title and description
  - [ ] Set route polyline using map
  - [ ] Save and verify changes persist
- [ ] Publish the version (toggle from draft to published)
  - [ ] Verify status badge changes
- [ ] Unpublish the version (toggle from published to draft)
  - [ ] Verify status badge changes back
- [ ] Create a second version (French) and copy route from Italian
  - [ ] Verify route is copied
- [ ] Delete a version
  - [ ] Verify deletion confirmation works
  - [ ] Verify version is removed from list

---

### 3. Mark Phase 5 as Complete

- [ ] Update `tasks/todo.md` to mark all Phase 5 tasks as complete
- [ ] Add review section with summary of changes

---

## Implementation Details

### Unpublish Method (AdminToursService)

```typescript
async unpublishVersion(tourId: string, versionId: string): Promise<VersionResponseDto> {
  // Verify version exists and belongs to tour
  const existing = await this.prisma.tourVersion.findUnique({
    where: { id: versionId },
  });

  if (!existing) {
    throw new NotFoundException('Version not found');
  }

  if (existing.tourId !== tourId) {
    throw new BadRequestException('Version does not belong to this tour');
  }

  const version = await this.prisma.tourVersion.update({
    where: { id: versionId },
    data: { status: 'draft' },
  });

  return this.mapVersionToDto(version);
}
```

### Unpublish Endpoint (AdminToursController)

```typescript
@Post(':tourId/versions/:versionId/unpublish')
@ApiOperation({
  summary: '[CMS] Unpublish version',
  description: 'Change version status from published to draft.'
})
@ApiParam({ name: 'tourId', description: 'Tour ID (UUID)' })
@ApiParam({ name: 'versionId', description: 'Version ID (UUID)' })
@ApiResponse({
  status: 200,
  description: 'Version unpublished successfully',
  type: VersionResponseDto
})
@ApiResponse({
  status: 404,
  description: 'Version not found'
})
async unpublishVersion(
  @Param('tourId') tourId: string,
  @Param('versionId') versionId: string,
): Promise<VersionResponseDto> {
  return this.adminToursService.unpublishVersion(tourId, versionId);
}
```

---

## Success Criteria

- ✅ All version CRUD operations work (create, read, update, delete)
- ✅ Publish/unpublish toggle works without errors
- ✅ Route copying works when creating new versions
- ✅ Map editor integrates properly with version editing
- ✅ No console errors in CMS
- ✅ Backend returns proper error messages for invalid requests
