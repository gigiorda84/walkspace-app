# Phase 7: Media Upload & Management - Implementation Plan

## Overview
Build a complete media library system for managing audio, images, and subtitle files in the CMS.

**Key Features:**
- Media library page with file listing and filtering
- Drag-and-drop file upload with progress tracking
- File versioning support (already in backend)
- File browser/picker modal for associating with point localizations
- File deletion with usage validation
- Search and filter by file type

---

## Current Backend Status ✅

**Already Implemented:**
- ✅ Media versioning (version, isActive, originalFilename fields)
- ✅ `POST /admin/media/upload` - Upload new file
- ✅ `POST /admin/media/:id/upload-version` - Upload new version
- ✅ `GET /admin/media` - List all media files
- ✅ `GET /admin/media/:id` - Get single file details
- ✅ `DELETE /admin/media/:id` - Delete file
- ✅ File validation (type, size, storage)
- ✅ MediaFileResponseDto with version info

**Backend is ready!** No new endpoints needed.

---

## Frontend Tasks

### 1. Create Media API Client
**File:** `cms/src/lib/api/media.ts` (already exists, may need review)

**Methods needed:**
- `getMediaFiles()` - List all files with optional filters
- `getMediaFile(id)` - Get single file details
- `uploadFile(file, type)` - Upload new file
- `uploadNewVersion(id, file)` - Upload new version
- `deleteFile(id)` - Delete file

**Steps:**
- [ ] Review existing media.ts API client
- [ ] Ensure all methods are implemented
- [ ] Add TypeScript types for responses
- [ ] Test API integration

---

### 2. Create Media Library Page (`/media`)
**File:** `cms/src/app/media/page.tsx`

**Features:**
- List all media files in a table/grid
- Show file metadata (name, type, size, upload date, version)
- Filter by type (audio, image, subtitle, all)
- Search by filename
- Upload button (opens upload modal)
- Actions: View details, Download, Delete

**Components needed:**
- MediaLibrary (main page component)
- MediaTable (table with file rows)
- MediaFilters (type filter + search)
- MediaActions (action buttons per file)

**Steps:**
- [ ] Create `/media` page route
- [ ] Implement MediaLibrary component
- [ ] Add table with file listings
- [ ] Add type filter (Audio/Images/Subtitles/All)
- [ ] Add search by filename
- [ ] Add delete confirmation
- [ ] Show file version info
- [ ] Test with real media files

---

### 3. Create File Upload Component
**File:** `cms/src/components/FileUpload.tsx`

**Features:**
- Drag-and-drop zone
- File type validation (.mp3, .wav, .jpg, .png, .srt)
- File size validation (max 50MB for audio)
- Upload progress indicator
- Multiple file upload support
- Error handling and display

**Steps:**
- [ ] Create FileUpload component
- [ ] Implement drag-and-drop zone
- [ ] Add file type validation
- [ ] Add file size validation
- [ ] Show upload progress (percentage)
- [ ] Handle upload errors
- [ ] Test with large files (50MB audio)
- [ ] Test with multiple files

---

### 4. Create File Browser/Picker Modal
**File:** `cms/src/components/MediaBrowserModal.tsx`

**Features:**
- Modal/dialog for file selection
- Browse existing media files
- Filter by file type (e.g., only show audio when selecting audio)
- Search functionality
- Upload new file inline (without leaving modal)
- Select file and return ID to parent form

**Usage:**
- Used in point localization form
- Replaces text input for file IDs
- Provides visual file selection

**Steps:**
- [ ] Create MediaBrowserModal component
- [ ] Add file grid/list view
- [ ] Filter by file type (audio/image/subtitle)
- [ ] Add search functionality
- [ ] Integrate FileUpload component
- [ ] Add select/cancel buttons
- [ ] Return selected file ID to parent
- [ ] Test integration with localization form

---

### 5. Integrate File Browser into Localization Form
**File:** `cms/src/app/tours/[id]/points/[pointId]/localizations/page.tsx`

**Changes:**
- Replace text input fields for file IDs with "Browse" buttons
- Open MediaBrowserModal when Browse clicked
- Filter modal by file type (audio/image/subtitle)
- Display selected file name next to Browse button
- Allow clearing selection

**Steps:**
- [ ] Add "Browse" buttons to localization form
- [ ] Open modal filtered by file type
- [ ] Display selected file name
- [ ] Update form state with selected file ID
- [ ] Add "Clear" button to remove selection
- [ ] Test complete flow: browse → select → save localization

---

### 6. Add File Versioning UI
**File:** `cms/src/components/MediaVersionHistory.tsx`

**Features:**
- Show version history for a file
- Display version number, upload date, isActive status
- Upload new version button
- Mark version as active/inactive

**Steps:**
- [ ] Create MediaVersionHistory component
- [ ] Display version list
- [ ] Add "Upload New Version" button
- [ ] Implement version upload
- [ ] Show active/inactive status
- [ ] Test version management

---

### 7. Add File Details Page (Optional)
**File:** `cms/src/app/media/[id]/page.tsx`

**Features:**
- View full file details
- Show version history
- Display file usage (which points/localizations use this file)
- Download file
- Delete file (with usage warning)

**Steps:**
- [ ] Create media detail page
- [ ] Show file metadata
- [ ] Show version history
- [ ] Show file usage
- [ ] Add download button
- [ ] Add delete with confirmation
- [ ] Test navigation from media library

---

## Implementation Order

1. **Media API Client** (review/update existing)
2. **Media Library Page** (basic list + filters)
3. **File Upload Component** (drag-and-drop + validation)
4. **Integrate Upload into Media Library**
5. **File Browser Modal** (selection UI)
6. **Integrate Browser into Localization Form**
7. **File Versioning UI** (optional enhancement)
8. **File Details Page** (optional enhancement)

---

## File Structure

```
cms/src/
├── app/
│   └── media/
│       ├── page.tsx              # Media library main page
│       └── [id]/
│           └── page.tsx          # File details page (optional)
├── components/
│   ├── FileUpload.tsx            # Drag-and-drop upload
│   ├── MediaBrowserModal.tsx     # File selection modal
│   ├── MediaTable.tsx            # File listing table
│   ├── MediaFilters.tsx          # Type filter + search
│   └── MediaVersionHistory.tsx   # Version management
└── lib/
    └── api/
        └── media.ts              # Media API client (exists)
```

---

## Success Criteria

- ✅ Can view all uploaded files in media library
- ✅ Can upload files via drag-and-drop
- ✅ Upload shows progress for large files
- ✅ Can filter files by type (audio/images/subtitles)
- ✅ Can search files by name
- ✅ Can select files from modal in localization form
- ✅ Can upload new versions of existing files
- ✅ Can delete files (with usage validation)
- ✅ File browser is user-friendly and intuitive

---

## Technical Notes

### File Upload Implementation
- Use FormData for multipart/form-data
- Track upload progress with XMLHttpRequest or axios onUploadProgress
- Validate file type and size client-side before upload
- Show clear error messages for invalid files

### File Type Validation
```typescript
const ALLOWED_TYPES = {
  audio: ['.mp3', '.wav'],
  image: ['.jpg', '.jpeg', '.png'],
  subtitle: ['.srt']
};

const MAX_FILE_SIZE = {
  audio: 50 * 1024 * 1024, // 50MB
  image: 10 * 1024 * 1024,  // 10MB
  subtitle: 1 * 1024 * 1024 // 1MB
};
```

### File Browser Modal
- Use React Portal for proper modal rendering
- Filter files by type based on selection context
- Show file thumbnails for images
- Show waveform icon for audio
- Show text icon for subtitles
- Allow quick upload if file not found

---

## Dependencies

**New packages to install:**
```bash
npm install react-dropzone  # For drag-and-drop upload
npm install @headlessui/react  # For modal component
```

---

## Testing Checklist

- [ ] Upload small file (< 1MB)
- [ ] Upload large file (50MB audio)
- [ ] Upload multiple files at once
- [ ] Filter by each file type
- [ ] Search for files
- [ ] Select file from modal
- [ ] Upload file from within modal
- [ ] Delete file not in use
- [ ] Try to delete file in use (should warn)
- [ ] Upload new version of file
- [ ] View version history
- [ ] Select different file versions

---

## Timeline Estimate

- Media API Client: 30 min
- Media Library Page: 2 hours
- File Upload Component: 2 hours
- File Browser Modal: 2 hours
- Integration with Localization Form: 1 hour
- File Versioning UI: 1 hour
- Testing: 1 hour

**Total:** ~9-10 hours of development

---

**Status:** 📝 Planning Complete - Ready to Begin Implementation
**Next:** Install dependencies and create media API client
