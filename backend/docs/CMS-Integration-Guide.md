# CMS API Integration Guide

Complete guide for building the BANDITE Sonic Walkscape Content Management System.

## Table of Contents
1. [Overview](#overview)
2. [Tour Creation Workflow](#tour-creation-workflow)
3. [Multilingual Content](#multilingual-content)
4. [Version Management](#version-management)
5. [Media Management](#media-management)
6. [Publishing Workflow](#publishing-workflow)

---

## Overview

### Base URL
```
Local: http://localhost:3000
Production: https://api.bandite.org
```

### API Documentation
Interactive documentation: `http://localhost:3000/api/docs`

### Authentication
**Note:** CMS endpoints currently use `@Public()` decorator. Production should implement CMS JWT authentication.

---

## Tour Creation Workflow

### Complete Workflow Example

```javascript
// 1. CREATE TOUR
const tour = await createTour({
  slug: "milan-historic-center",
  defaultCity: "Milan",
  defaultDurationMinutes: 90,
  defaultDistanceKm: 3.5,
  isProtected: false
});

// 2. CREATE LANGUAGE VERSION (Italian)
const italianVersion = await createVersion(tour.id, {
  language: "it",
  title: "Centro Storico di Milano",
  description: "Un viaggio sonoro attraverso il cuore di Milano",
  startingPointLat: 45.464211,
  startingPointLng: 9.191383
});

// 3. ADD GPS POINTS
const point1 = await createPoint(tour.id, {
  order: 1,
  lat: 45.464211,
  lng: 9.191383,
  defaultTriggerRadiusMeters: 150
});

const point2 = await createPoint(tour.id, {
  order: 2,
  lat: 45.465123,
  lng: 9.192456,
  defaultTriggerRadiusMeters: 150
});

// 4. ADD LOCALIZED CONTENT
await createLocalization(tour.id, point1.id, {
  language: "it",
  title: "Duomo di Milano",
  contentText: "Benvenuti al Duomo...",
  audioUrl: "https://storage.example.com/audio/point-1-it.mp3",
  imageUrl: "https://storage.example.com/images/duomo.jpg"
});

await createLocalization(tour.id, point2.id, {
  language: "it",
  title: "Galleria Vittorio Emanuele II",
  contentText: "La storica galleria...",
  audioUrl: "https://storage.example.com/audio/point-2-it.mp3",
  imageUrl: "https://storage.example.com/images/galleria.jpg"
});

// 5. PUBLISH VERSION
await publishVersion(tour.id, italianVersion.id);
```

---

## API Endpoints

### Tours Management

#### 1. List All Tours

```http
GET /admin/tours
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "slug": "milan-historic-center",
    "defaultCity": "Milan",
    "defaultDurationMinutes": 90,
    "defaultDistanceKm": 3.5,
    "isProtected": false,
    "versionCount": 3,
    "pointCount": 15,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### 2. Create Tour

```http
POST /admin/tours
Content-Type: application/json

{
  "slug": "milan-historic-center",
  "defaultCity": "Milan",
  "defaultDurationMinutes": 90,
  "defaultDistanceKm": 3.5,
  "isProtected": false
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "slug": "milan-historic-center",
  "defaultCity": "Milan",
  "defaultDurationMinutes": 90,
  "defaultDistanceKm": 3.5,
  "isProtected": false,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### 3. Update Tour

```http
PATCH /admin/tours/:tourId
Content-Type: application/json

{
  "defaultDurationMinutes": 120,
  "defaultDistanceKm": 4.0
}
```

#### 4. Delete Tour

```http
DELETE /admin/tours/:tourId
```

**Note:** Cascading delete removes all versions, points, and localizations.

---

## Multilingual Content

### Version Numbering

- Version numbers **increment per tour**, not per language
- Each language gets the next available version number
- Example:
  - Italian version: `versionNumber = 1`
  - French version: `versionNumber = 2`
  - English version: `versionNumber = 3`

### Create Language Version

```http
POST /admin/tours/:tourId/versions
Content-Type: application/json

{
  "language": "it",
  "title": "Centro Storico di Milano",
  "description": "Un viaggio sonoro attraverso il cuore di Milano",
  "startingPointLat": 45.464211,
  "startingPointLng": 9.191383
}
```

**Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "tourId": "550e8400-e29b-41d4-a716-446655440000",
  "versionNumber": 1,
  "language": "it",
  "title": "Centro Storico di Milano",
  "description": "Un viaggio sonoro...",
  "status": "draft",
  "startingPoint": {
    "lat": 45.464211,
    "lng": 9.191383
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Localization Auto-Linking

When creating a point localization, it **automatically links to the version** with the matching language:

```http
POST /admin/tours/:tourId/points/:pointId/localizations
Content-Type: application/json

{
  "language": "it",  // Automatically finds Italian version
  "title": "Duomo di Milano",
  "contentText": "Benvenuti al Duomo...",
  "audioUrl": "https://storage.example.com/audio/point-1-it.mp3"
}
```

**System automatically:**
1. Finds the tour version with `language = "it"`
2. Sets `tourVersionId` to that version's ID
3. Associates localization with correct version

---

## Version Management

### Version Status Flow

```
draft → published → draft (unpublish not supported yet)
```

### Draft vs Published

| Status | Mobile API | CMS API | Use Case |
|--------|------------|---------|----------|
| **draft** | Hidden | Visible | Work in progress |
| **published** | Visible | Visible | Live to users |

### Publish Version

```http
POST /admin/tours/:tourId/versions/:versionId/publish
```

**Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "published",
  "publishedAt": "2024-01-01T12:00:00Z"
}
```

**Effect:** Tour immediately appears in mobile API (`GET /tours`)

---

## Points and Localizations

### Create GPS Point

```http
POST /admin/tours/:tourId/points
Content-Type: application/json

{
  "order": 1,
  "lat": 45.464211,
  "lng": 9.191383,
  "defaultTriggerRadiusMeters": 150
}
```

**Unique Constraints:**
- `order` must be unique per tour
- Use `order` values like 1, 2, 3... for sequential triggering

### Create Localization

```http
POST /admin/tours/:tourId/points/:pointId/localizations
Content-Type: application/json

{
  "language": "it",
  "title": "Duomo di Milano",
  "contentText": "Benvenuti al Duomo, simbolo di Milano...",
  "audioUrl": "https://storage.example.com/audio/point-1-it.mp3",
  "imageUrl": "https://storage.example.com/images/duomo.jpg",
  "subtitleUrl": null
}
```

**Required Fields:**
- `language`: Must match an existing version's language
- `title`: Point title in specified language

**Optional Fields:**
- `contentText`: Text description
- `audioUrl`: URL to audio file (will be signed for manifest)
- `imageUrl`: URL to image file
- `subtitleUrl`: URL to .srt subtitle file

---

## Media Management

### Media Upload (Future)

```http
POST /admin/media/upload
Content-Type: multipart/form-data

{
  "file": <binary>,
  "type": "audio",  // audio, image, subtitle
  "tourId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440020",
  "filename": "point-1-audio.mp3",
  "type": "audio",
  "sizeBytes": 5242880,
  "url": "https://storage.example.com/audio/point-1.mp3",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Current Implementation:**
- Upload media to your storage provider (S3, Cloud Storage, etc.)
- Get public URL
- Use URL in localization creation

**File Requirements:**
- **Audio**: MP3 or WAV, max 50MB per file
- **Images**: JPG or PNG, recommended 1920x1080
- **Subtitles**: SRT format

---

## Publishing Workflow

### Recommended Workflow

```javascript
async function createAndPublishTour() {
  // 1. Create base tour
  const tour = await createTour({
    slug: "new-tour",
    defaultCity: "Florence",
    defaultDurationMinutes: 60,
    defaultDistanceKm: 2.5,
    isProtected: false
  });

  // 2. For each language
  for (const lang of ["it", "fr", "en"]) {
    // Create version
    const version = await createVersion(tour.id, {
      language: lang,
      title: titles[lang],
      description: descriptions[lang],
      startingPointLat: 43.7696,
      startingPointLng: 11.2558
    });

    // Add points (shared across languages)
    if (lang === "it") {  // Create points once
      for (let i = 1; i <= 10; i++) {
        const point = await createPoint(tour.id, {
          order: i,
          lat: points[i].lat,
          lng: points[i].lng,
          defaultTriggerRadiusMeters: 150
        });
        pointIds.push(point.id);
      }
    }

    // Add localizations for this language
    for (let i = 0; i < pointIds.length; i++) {
      await createLocalization(tour.id, pointIds[i], {
        language: lang,
        title: localizedTitles[lang][i],
        contentText: localizedContent[lang][i],
        audioUrl: audioUrls[lang][i],
        imageUrl: imageUrls[i]  // Shared image
      });
    }

    // Publish version
    await publishVersion(tour.id, version.id);
  }

  console.log(`Tour ${tour.slug} published in 3 languages!`);
}
```

### Quality Checklist

Before publishing:
- [ ] All points have GPS coordinates
- [ ] All points have unique order numbers (1, 2, 3...)
- [ ] All points have localizations for ALL published languages
- [ ] All media files are uploaded and URLs are valid
- [ ] Trigger radii are appropriate (100-300m recommended)
- [ ] Starting point coordinates are correct
- [ ] Tour metadata (duration, distance) is accurate
- [ ] Test in mobile app before public release

---

## Data Model Reference

### Tour
```typescript
interface Tour {
  id: string;
  slug: string;  // URL-friendly, unique
  defaultCity: string;
  defaultDurationMinutes: number;
  defaultDistanceKm: number;
  isProtected: boolean;
  coverImageFileId?: string;
  videoFileId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Tour Version
```typescript
interface TourVersion {
  id: string;
  tourId: string;
  versionNumber: number;  // Auto-incremented per tour
  language: "it" | "fr" | "en";
  title: string;
  description: string;
  status: "draft" | "published";
  startingPointLat: number;
  startingPointLng: number;
  routePolyline?: string;  // GeoJSON or encoded polyline
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}
```

### Tour Point
```typescript
interface TourPoint {
  id: string;
  tourId: string;
  order: number;  // Sequential: 1, 2, 3...
  lat: number;
  lng: number;
  defaultTriggerRadiusMeters: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Point Localization
```typescript
interface PointLocalization {
  id: string;
  tourPointId: string;
  tourVersionId: string;  // Auto-linked by language
  language: "it" | "fr" | "en";
  title: string;
  contentText?: string;
  audioUrl?: string;
  imageUrl?: string;
  subtitleUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Error Handling

### Common Errors

**409 Conflict - Duplicate Tour Slug**
```json
{
  "statusCode": 409,
  "message": "Tour with slug 'milan-historic-center' already exists"
}
```
**Solution:** Use a different slug

**409 Conflict - Duplicate Point Order**
```json
{
  "statusCode": 409,
  "message": "Point with order 1 already exists for this tour"
}
```
**Solution:** Use next available order number

**409 Conflict - Duplicate Language Version**
```json
{
  "statusCode": 409,
  "message": "Version for language 'it' already exists"
}
```
**Solution:** Update existing version instead

**404 Not Found - Missing Version for Language**
```json
{
  "statusCode": 404,
  "message": "No version found for language 'it'"
}
```
**Solution:** Create version before adding localizations

---

## React/Next.js Integration Example

```typescript
// hooks/useTours.ts
import { useState, useEffect } from 'react';

export function useTours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/admin/tours')
      .then(res => res.json())
      .then(setTours)
      .finally(() => setLoading(false));
  }, []);

  return { tours, loading };
}

// components/TourEditor.tsx
export function TourEditor({ tourId }: { tourId: string }) {
  const [tour, setTour] = useState(null);

  async function handlePublishVersion(versionId: string) {
    const response = await fetch(
      `http://localhost:3000/admin/tours/${tourId}/versions/${versionId}/publish`,
      { method: 'POST' }
    );

    if (response.ok) {
      const updatedVersion = await response.json();
      // Update UI
      toast.success(`Version published!`);
    }
  }

  return (
    <div>
      {tour.versions.map(version => (
        <VersionCard
          key={version.id}
          version={version}
          onPublish={() => handlePublishVersion(version.id)}
        />
      ))}
    </div>
  );
}
```

---

## Best Practices

1. **Tour Creation**
   - Use descriptive, URL-friendly slugs
   - Set accurate duration and distance
   - Mark tours as protected if they require vouchers

2. **Versioning**
   - Create all language versions before adding content
   - Keep version content synchronized across languages
   - Test draft versions before publishing

3. **Points**
   - Use sequential order numbers (1, 2, 3...)
   - Set appropriate trigger radii (100-300m)
   - Ensure GPS coordinates are accurate

4. **Localizations**
   - Provide content for all supported languages
   - Use consistent terminology across languages
   - Include both audio and text content

5. **Media**
   - Optimize audio files (MP3, 128-192kbps)
   - Compress images before upload
   - Use descriptive filenames

6. **Publishing**
   - Review all content before publishing
   - Test in mobile app
   - Coordinate releases across languages

---

## Support

- **API Documentation**: http://localhost:3000/api/docs
- **Postman Collection**: `backend/docs/postman/CMS-API.postman_collection.json`
- **GitHub Issues**: https://github.com/bandite/backend/issues
