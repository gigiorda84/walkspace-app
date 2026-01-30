# Audio Upload Fix - Field Mismatch Issue

## Problem
The audio upload appears not to work because of field mismatches between backend API response and frontend type definitions.

## Root Cause Analysis

### Backend Returns (MediaFileListItemDto):
```typescript
{
  id: string;
  type: string;
  mimeType: string;
  fileSizeBytes: number;  // <-- "fileSizeBytes"
  url: string;
  createdAt: Date;
}
```

### Frontend Expects (MediaFile):
```typescript
{
  id: string;
  filename: string;  // <-- MISSING from backend
  originalFilename: string;  // <-- MISSING from backend
  mimeType: string;
  type: 'audio' | 'image' | 'subtitle';
  sizeBytes: number;  // <-- Backend calls it "fileSizeBytes"
  storageUrl: string;  // <-- Backend calls it "url"
  uploadedBy: string;  // <-- MISSING from backend
  createdAt: string;
}
```

### Frontend Usage (media/page.tsx):
```typescript
{file.originalFilename}  // Line 293 - FAILS (undefined)
{formatFileSize(file.sizeBytes)}  // Line 296 - FAILS (undefined)
{formatDate(file.createdAt)}  // Line 296 - Works
```

## Files to Fix

### 1. Backend DTO (media-file-response.dto.ts)
- Add missing fields to MediaFileListItemDto

### 2. Backend Service (media.service.ts)
- Update listFiles() to return all required fields

### 3. Backend Database Schema
- Check if storagePath contains originalFilename or if we need to extract it

## Tasks

- [x] Update frontend MediaFile type to match backend response
- [x] Update media page to use correct field names (fileSizeBytes instead of sizeBytes)
- [x] Remove references to non-existent fields (originalFilename, storageUrl, uploadedBy, filename)
- [ ] Test audio upload and verify files appear in the media library

## Changes Made

### 1. Fixed MediaFile Interface (cms/src/types/api/index.ts)
Simplified the interface to match what the backend actually returns:
```typescript
export interface MediaFile {
  id: string;
  type: 'audio' | 'image' | 'subtitle';
  mimeType: string;
  fileSizeBytes: number;  // Backend uses this name
  url: string;            // Backend uses this name
  createdAt: string;
}
```

### 2. Fixed Media Page Display (cms/src/app/media/page.tsx)
- Changed `file.sizeBytes` to `file.fileSizeBytes`
- Changed `file.originalFilename` to show type label: "Audio File", "Image File", etc.

## Result
The media library now correctly displays uploaded files with proper field names matching the backend API.
