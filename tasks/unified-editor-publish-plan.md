# Unified Editor Publish/Unpublish Plan

## Objective
Make the unified editor (`/tours/[id]/edit`) the single source of truth for all tour editing, including version status management (publish/unpublish).

## Current State Analysis

### What Exists
- ✅ Unified editor at `/tours/[id]/edit`
- ✅ Tour metadata editing (slug, city, duration, distance, protection)
- ✅ Version content editing (title, description, completion message, cover image)
- ✅ Map editor with GPS points
- ✅ Point content editing (title, description, audio, subtitles, images)
- ✅ Language switching
- ✅ Auto-save functionality
- ✅ Database has `status` column in `tour_versions` table (draft/published)

### What's Missing
- ❌ Publish/unpublish button
- ❌ Version status indicator (draft/published badge)
- ❌ Version status tracking in state
- ❌ Warning when editing published versions
- ❌ Backend API endpoint for publishing/unpublishing

## Implementation Plan

### Phase 1: Backend API Enhancement
**Files to modify:**
- `backend/src/versions/versions.controller.ts`
- `backend/src/versions/versions.service.ts`
- `backend/src/versions/dto/update-version-status.dto.ts` (new)

**Changes:**
1. Add `PATCH /admin/tour-versions/:versionId/status` endpoint
   - Accepts: `{ status: 'draft' | 'published' }`
   - Returns: Updated version object
   - Validates: Only one version per language can be published at a time
   - Auto-unpublishes other versions of same language if publishing

2. Update version DTO types to include status field

### Phase 2: CMS API Client
**Files to modify:**
- `cms/src/lib/api/versions.ts`

**Changes:**
1. Add `publishVersion(versionId: string)` method
2. Add `unpublishVersion(versionId: string)` method
3. Add `updateVersionStatus(versionId: string, status: 'draft' | 'published')` method

### Phase 3: Unified Editor UI Updates
**Files to modify:**
- `cms/src/app/tours/[id]/edit/page.tsx`

**Changes:**

#### 3.1 State Management
```typescript
// Add to existing state
const [versionStatus, setVersionStatus] = useState<'draft' | 'published'>('draft');
const [publishing, setPublishing] = useState(false);
```

#### 3.2 Fetch Version Status
```typescript
// Update versionContent state to include status
useEffect(() => {
  if (versions.length > 0 && selectedLanguage) {
    const currentVersion = versions.find(v => v.language === selectedLanguage);
    if (currentVersion) {
      setVersionContent({
        title: currentVersion.title || '',
        description: currentVersion.description || '',
        completionMessage: currentVersion.completionMessage || '',
        coverImageFileId: currentVersion.coverImageFileId || '',
        versionId: currentVersion.id,
      });
      setVersionStatus(currentVersion.status);
    }
  }
}, [versions, selectedLanguage]);
```

#### 3.3 Publish/Unpublish Mutation
```typescript
const publishMutation = useMutation({
  mutationFn: (status: 'draft' | 'published') =>
    versionsApi.updateVersionStatus(versionContent.versionId, status),
  onSuccess: () => {
    queryClient.invalidateQueries(['tour-versions', tourId]);
    // Show success message
  },
});
```

#### 3.4 UI Components to Add

**A. Status Badge (in language selector area)**
```tsx
<div className="flex items-center gap-2">
  <button className="px-4 py-2 bg-indigo-600 text-white rounded">
    {LANGUAGE_LABELS[selectedLanguage]}
  </button>

  {/* Status badge */}
  <span className={`px-2 py-1 text-xs rounded ${
    versionStatus === 'published'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-600'
  }`}>
    {versionStatus === 'published' ? '✓ Published' : 'Draft'}
  </span>
</div>
```

**B. Publish/Unpublish Button (in header or near language selector)**
```tsx
<button
  onClick={() => {
    const newStatus = versionStatus === 'published' ? 'draft' : 'published';
    publishMutation.mutate(newStatus);
  }}
  disabled={publishing || !versionContent.versionId}
  className={`px-4 py-2 rounded font-medium ${
    versionStatus === 'published'
      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      : 'bg-green-600 text-white hover:bg-green-700'
  }`}
>
  {publishing ? 'Saving...' : (
    versionStatus === 'published' ? 'Unpublish' : 'Publish'
  )}
</button>
```

**C. Warning Alert (when editing published version)**
```tsx
{versionStatus === 'published' && (
  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
    <div className="flex items-center gap-2">
      <AlertTriangle size={16} className="text-yellow-600" />
      <p className="text-sm text-yellow-800">
        You are editing a <strong>published</strong> version.
        Changes will be immediately visible to users.
      </p>
    </div>
  </div>
)}
```

### Phase 4: Remove/Deprecate Old Version Editor
**Files to modify/remove:**
- `cms/src/app/tours/[id]/versions/[versionId]/edit/page.tsx` - Can be removed
- Update links in tour details page to use unified editor instead

**Changes:**
1. Remove separate version editor page
2. Update all navigation links to point to `/tours/[id]/edit`
3. Update "Edit" buttons in tour version cards to use unified editor

### Phase 5: Enhanced Features (Optional)
**Nice-to-have additions:**

1. **Version History**
   - Show list of all versions (published + drafts) per language
   - Allow switching between multiple draft versions
   - Clone published version to create new draft

2. **Validation Before Publishing**
   - Ensure all required fields are filled:
     - Tour title ✓
     - At least one GPS point ✓
     - All points have audio files ✓
   - Show validation errors if incomplete

3. **Publish Preview**
   - "Preview as mobile app" button
   - Shows what users will see

## File Structure Summary

```
backend/src/versions/
  ├── dto/
  │   └── update-version-status.dto.ts (NEW)
  ├── versions.controller.ts (MODIFY)
  └── versions.service.ts (MODIFY)

cms/src/
  ├── lib/api/
  │   └── versions.ts (MODIFY)
  ├── app/tours/[id]/
  │   ├── edit/page.tsx (MODIFY - main work here)
  │   ├── page.tsx (MODIFY - update links)
  │   └── versions/[versionId]/edit/page.tsx (REMOVE)
  └── components/ (optional)
      └── tours/
          ├── VersionStatusBadge.tsx (NEW)
          └── PublishButton.tsx (NEW)
```

## Testing Checklist

### Backend Tests
- [ ] Can publish a draft version
- [ ] Can unpublish a published version
- [ ] Publishing auto-unpublishes other versions of same language
- [ ] Cannot have multiple published versions per language
- [ ] Returns proper error messages

### Frontend Tests
- [ ] Status badge shows correct state (draft/published)
- [ ] Publish button toggles correctly
- [ ] Warning appears when editing published version
- [ ] Status updates without page refresh
- [ ] Can switch between languages and status persists correctly
- [ ] Auto-save doesn't interfere with publish status

### Integration Tests
- [ ] Mobile API returns only published versions
- [ ] CMS shows both draft and published versions
- [ ] Editing published version doesn't create duplicate
- [ ] Version status changes reflect in tour details page

## Estimated Implementation Time
- Phase 1 (Backend): 1-2 hours
- Phase 2 (API Client): 30 minutes
- Phase 3 (UI Updates): 2-3 hours
- Phase 4 (Cleanup): 1 hour
- Phase 5 (Optional): 2-4 hours

**Total Core Implementation: 4-6 hours**

## Risks & Considerations

1. **Data Integrity**: Ensure only one published version per language
2. **User Experience**: Clear messaging about publish state
3. **Auto-save Conflicts**: Don't auto-publish when saving
4. **Mobile App Cache**: Users may still see old published version until they refresh
5. **Rollback**: Add ability to revert to previous published version if needed

## Success Criteria

✅ Users can publish/unpublish versions directly from unified editor
✅ Status is clearly visible at all times
✅ No need to use separate version editor
✅ Published versions are immediately available via mobile API
✅ Draft versions are not visible to mobile users
✅ Only one published version per language at a time
