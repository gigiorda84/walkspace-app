# Task: Create Comprehensive Tour Points Editor

## Context
User wants a single page to edit all point content for a tour:
- Title for each point
- Optional description
- Audio track
- Subtitles
- Optional photo

This is the main editor for creating/editing tour content.

## Current State
- Points are managed separately on `/tours/[id]/points/page.tsx`
- Localizations are edited individually on `/tours/[id]/points/[pointId]/localizations/page.tsx`
- User has to navigate to each point separately to edit content

## Goal
Create a unified editor page where all points and their content can be edited in one view.

## Plan

### Todo Items

- [ ] Create comprehensive tour editor page at `/tours/[id]/editor/page.tsx`
  - Show all points in a list/table
  - For each point, show editable fields for selected language:
    - Title (required)
    - Description (optional)
    - Audio track (browse/upload)
    - Subtitles (browse/upload)
    - Photo/image (optional, browse/upload)
  - Language selector at top to switch between languages
  - Save changes per point or save all at once
  - Show which points are complete vs incomplete

- [ ] Add navigation to the editor from tour detail page
  - Add "Edit Tour Content" button on tour detail page
  - Should be prominent primary action

- [ ] Test the complete flow
  - Navigate to tour editor
  - Select a language
  - Edit point content
  - Associate media files
  - Save changes
  - Verify data persists

## Design Considerations
- Keep it simple and focused
- Use accordion or expandable cards for each point
- Show visual indicators for completed points (has title + audio)
- Make media selection easy with media browser
- Auto-save or clear save buttons

## Notes
- This will be the primary interface for content creators
- Should work well with the existing points and localization APIs
- Consider adding bulk operations later (copy from one language to another)

## Review Section

### Implementation Complete ✅

**Files Created (1):**
- `/cms/src/app/tours/[id]/editor/page.tsx` - Comprehensive tour content editor

**Files Modified (1):**
- `/cms/src/app/tours/[id]/page.tsx` - Added prominent "Open Editor" button

### Features Implemented

#### 1. Comprehensive Tour Editor (`/tours/[id]/editor`)

**Key Features:**
- **Language selector** - Switch between tour languages (Italian, French, English)
- **Expandable point cards** - Each point can be expanded/collapsed
- **Complete status indicators** - Visual checkmark when point has title + audio
- **All content fields per point:**
  - Title (required)
  - Description (optional textarea)
  - Audio track (browse media library)
  - Subtitles (browse media library)
  - Photo (optional, browse media library)
- **Individual save buttons** - Save each point independently
- **Breadcrumb navigation** - Tours → Tour Name → Content Editor

**Smart Error Handling:**
- Shows helpful message if no language versions exist
- Shows helpful message if no points exist
- Provides links to create versions/points

#### 2. Tour Detail Page Enhancement

**Added:**
- Prominent gradient CTA banner with "Open Editor" button
- Only shows when tour has both versions AND points
- Clear description: "Add titles, descriptions, audio tracks, and photos to your tour points"

### User Flow

1. **Navigate to Tour** → View tour details
2. **Click "Open Editor"** → Opens comprehensive editor
3. **Select Language** → Choose which language to edit
4. **Expand Point** → Click to expand any point
5. **Edit Content:**
   - Enter title
   - Add optional description
   - Browse & select audio file
   - Browse & select subtitle file
   - Browse & select photo (optional)
6. **Save** → Click "Save Point" to persist changes
7. **Visual Feedback** → Checkmark appears when point is complete

### Technical Implementation

- Uses accordion pattern for space efficiency
- Fetches all localizations in parallel for performance
- Maintains local state for editing before save
- Integrates with existing MediaBrowserModal component
- Uses existing API endpoints (no backend changes needed)
- Follows existing code patterns and styling

### Benefits

✅ **Streamlined workflow** - Edit all point content in one place
✅ **Clear progress tracking** - See which points are complete at a glance
✅ **Efficient** - No need to navigate between multiple pages
✅ **User-friendly** - Expandable cards keep interface clean
✅ **Complete** - All fields accessible: title, description, audio, subtitles, photo

This is now the **primary interface** for content creators to build their tours!
