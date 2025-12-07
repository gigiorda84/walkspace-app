# CMS Development Plan - Phase 1 Completion

## Overview
Building the Web CMS (Next.js + React) to complete Phase 1 of the BANDITE Sonic Walkscape project.

**Tech Stack:**
- Next.js 14+ (App Router)
- React + TypeScript
- MapLibre GL JS (for map editor)
- Tailwind CSS (styling)
- React Hook Form (forms)
- Tanstack Query (data fetching)
- Zustand (state management)

---

## Phase 1: Project Setup & Foundation ✅ COMPLETED
### Tasks
- [x] Initialize Next.js 14 project with TypeScript
- [x] Configure Tailwind CSS
- [x] Set up project structure (app/, components/, lib/, types/)
- [x] Install core dependencies (react-hook-form, @tanstack/react-query, zustand)
- [x] Create API client utilities for backend integration
- [x] Set up environment variables (.env.local with backend API URL)
- [x] Create basic layout components (Navbar, Sidebar, PageHeader)

**Summary:**
- ✅ Next.js 14 initialized with TypeScript and Tailwind CSS
- ✅ Project structure created (src/app, src/components, src/lib, src/types)
- ✅ Core dependencies installed (react-hook-form, @tanstack/react-query, zustand, axios)
- ✅ API client with JWT auth and token refresh configured
- ✅ Type definitions for all API entities created
- ✅ Layout components (Navbar, Sidebar, PageHeader, MainLayout) implemented
- ✅ QueryClientProvider integrated into app
- ✅ Dev server tested and working on http://localhost:3001

---

## Phase 2: Authentication & Authorization ✅ COMPLETED
### Tasks
- [x] Create login page (/login)
- [x] Implement JWT token management (localStorage + refresh logic)
- [x] Create authentication context/provider
- [x] Add protected route middleware
- [x] Implement role-based access control (admin vs editor)
- [x] Create logout functionality
- [ ] Add "Forgot Password" flow (if backend supports it) - SKIPPED

**Summary:**
- ✅ Login page with form validation and error handling
- ✅ JWT token storage and automatic refresh on 401 errors
- ✅ AuthContext/AuthProvider for global auth state management
- ✅ ProtectedRoute component for client-side route protection
- ✅ Next.js middleware for route handling
- ✅ Role-based access control (admin/editor) in auth context
- ✅ Logout functionality integrated in Navbar
- ✅ User info display with role badge in Navbar

---

## Phase 3: Tours Management (List & CRUD) ✅ COMPLETED
### Tasks
- [x] Create tours list page (/tours)
  - [x] Display all tours in a table/grid
  - [ ] Add filters (city, status, language) - DEFERRED
  - [ ] Add search functionality - DEFERRED
  - [x] Show tour metadata (slug, city, distance, duration)
- [x] Create tour detail page (/tours/[id])
  - [x] Display full tour information
  - [x] Show all language versions
  - [x] List all points
- [x] Create "New Tour" form (/tours/new)
  - [x] Basic info: slug, city, duration, distance
  - [x] Protection status (public/protected)
  - [x] Form validation
- [x] Create "Edit Tour" page (/tours/[id]/edit)
  - [x] Update tour metadata
  - [x] Change protection status
- [x] Add delete tour functionality (with confirmation)
- [x] Implement tour duplication/cloning feature

**Summary:**
- ✅ Tours API service with all CRUD operations
- ✅ Tours list page with table display
- ✅ Tour detail page showing info, versions, and points
- ✅ Create new tour form with validation
- ✅ Edit tour page with pre-populated data
- ✅ Delete confirmation dialog
- ✅ Clone/duplicate tour functionality
- ✅ Protected route integration
- ✅ Loading states and error handling
- ✅ Responsive table layout with action buttons

---

## Phase 4: Map Editor & Route Management ✅ COMPLETED
### Tasks
- [x] Install MapLibre GL JS and React bindings
- [x] Create map editor component
  - [x] Initialize map with default view
  - [x] Add drawing controls for polylines
  - [x] Enable route editing (drag vertices, add/remove points)
  - [x] Save route polyline to tour version
- [x] Create points management interface
  - [x] Add point markers on map (draggable)
  - [x] Set point sequence order (1, 2, 3...)
  - [x] Configure trigger radius per point (visual circle on map)
  - [x] Point details panel (lat/lng, radius, order)
- [x] Add point CRUD operations
  - [x] Create new point by clicking map
  - [x] Edit point position and properties
  - [x] Delete point (with confirmation)
  - [x] Reorder points (drag-and-drop sequence)
- [x] Integrate route + points editor into tour version page

**Summary:**
- ✅ MapLibre GL JS integrated with react-map-gl
- ✅ Interactive map with custom basemap (CartoDB Voyager)
- ✅ MapEditor component with draggable point markers
- ✅ Visual trigger radius circles for each point
- ✅ RouteDrawer component for polyline drawing
- ✅ PointsManager component with full CRUD operations
- ✅ Reorder points with up/down buttons
- ✅ Edit trigger radius per point (50-500m)
- ✅ Delete points with confirmation
- ✅ Map test page at /map-test for demonstration
- ✅ Real-time map updates when points change
- ✅ Sequential numbering of points

---

## Phase 5: Language Versions & Multilingual Content
### Tasks
- [ ] Create tour versions list (/tours/[id]/versions)
  - [ ] Show all language variants (it, fr, en)
  - [ ] Display status (draft/published)
- [ ] Create "New Version" form (/tours/[id]/versions/new)
  - [ ] Select language
  - [ ] Add title and description
  - [ ] Copy route from existing version (optional)
- [ ] Create version editor (/tours/[id]/versions/[versionId]/edit)
  - [ ] Edit title, description
  - [ ] Manage route polyline (map editor)
  - [ ] Change status (draft/published)
- [ ] Implement version publishing workflow
  - [ ] Publish/unpublish toggle
  - [ ] Validation before publishing
- [ ] Add version deletion

---

## Phase 6: Point Localizations & Content
### Tasks
- [ ] Create point localizations interface (/tours/[id]/versions/[versionId]/points/[pointId])
  - [ ] Show all languages for a point
  - [ ] Display audio, image, subtitle, text per language
- [ ] Create localization editor form
  - [ ] Text content (title, description)
  - [ ] Audio file upload/selection
  - [ ] Image upload/selection
  - [ ] Subtitle (.srt) upload/selection
- [ ] Implement CRUD for point localizations
  - [ ] Create new localization for a language
  - [ ] Update existing localization
  - [ ] Delete localization

---

## Phase 7: Media Upload & Management
### Tasks
- [ ] Create media library page (/media)
  - [ ] List all uploaded files (audio, images, subtitles)
  - [ ] Filter by type
  - [ ] Search by filename
  - [ ] Display file metadata (size, type, upload date)
- [ ] Implement file upload component
  - [ ] Drag-and-drop zone
  - [ ] Progress indicator for large files (audio up to 50MB)
  - [ ] File type validation (.mp3/.wav, .jpg/.png, .srt)
  - [ ] File size validation
- [ ] Create upload API integration
  - [ ] Connect to POST /admin/media/upload
  - [ ] Handle multipart/form-data
  - [ ] Display upload errors
- [ ] Add file selection modal (for associating with points)
  - [ ] Browse existing media
  - [ ] Upload new file inline
  - [ ] Select and attach to localization
- [ ] Implement file deletion (with usage check)

---

## Phase 8: Voucher Management
### Tasks
- [ ] Create vouchers list page (/vouchers)
  - [ ] Display all voucher batches
  - [ ] Show batch info (codes count, tour, expiration)
  - [ ] Display usage statistics
- [ ] Create "New Voucher Batch" form (/vouchers/new)
  - [ ] Select tour(s)
  - [ ] Set quantity of codes
  - [ ] Configure max uses per code
  - [ ] Set expiration date
  - [ ] Auto-generate or custom prefix
- [ ] Create voucher batch detail page (/vouchers/[batchId])
  - [ ] List all codes in batch
  - [ ] Show redemption status per code
  - [ ] Export codes as CSV
- [ ] Add voucher batch editing
  - [ ] Update expiration date
  - [ ] Activate/deactivate batch
- [ ] Implement individual voucher management
  - [ ] View redemption history
  - [ ] Deactivate specific codes

---

## Phase 9: Analytics Dashboard
### Tasks
- [ ] Create analytics overview page (/analytics)
  - [ ] Summary cards (total downloads, starts, completions)
  - [ ] Tour-by-tour breakdown
  - [ ] Language distribution chart
  - [ ] Voucher redemption stats
- [ ] Implement tour-specific analytics (/analytics/tours/[id])
  - [ ] Downloads over time (chart)
  - [ ] Start vs completion rate
  - [ ] Point-level engagement (which points trigger most)
  - [ ] Language preference breakdown
- [ ] Add date range filters
  - [ ] Last 7 days, 30 days, 90 days, all time
  - [ ] Custom date range picker
- [ ] Implement CSV export
  - [ ] Export tour analytics
  - [ ] Export voucher usage
  - [ ] Export user activity (GDPR-compliant)
- [ ] Create visualization components
  - [ ] Line charts for time-series data
  - [ ] Pie charts for language distribution
  - [ ] Bar charts for comparison

---

## Phase 10: UI/UX Polish & Testing
### Tasks
- [ ] Add loading states for all async operations
- [ ] Implement error boundaries
- [ ] Add toast notifications for success/error messages
- [ ] Improve form validation feedback
- [ ] Add keyboard shortcuts (Cmd+S to save, etc.)
- [ ] Implement breadcrumb navigation
- [ ] Add confirmation dialogs for destructive actions
- [ ] Optimize performance (code splitting, lazy loading)
- [ ] Add responsive design for tablet support
- [ ] Test all CRUD operations end-to-end
- [ ] Test role-based access (admin vs editor)
- [ ] Test file uploads (small and large files)
- [ ] Test map editor functionality
- [ ] Write basic E2E tests with Playwright (optional)

---

## Phase 11: Documentation & Deployment
### Tasks
- [ ] Write CMS user guide (for artistic team)
  - [ ] How to create a tour
  - [ ] How to add route and points
  - [ ] How to upload audio and manage content
  - [ ] How to publish tours
- [ ] Write deployment documentation
  - [ ] Environment variables setup
  - [ ] Build and deploy instructions
  - [ ] Vercel/Netlify configuration
- [ ] Create README.md for CMS repository
- [ ] Document component architecture
- [ ] Add inline code comments where necessary
- [ ] Create a demo video/walkthrough (optional)

---

## Additional Features (Nice-to-Have)
- [ ] Tour preview mode (simulate mobile experience)
- [ ] Bulk operations (delete multiple tours, etc.)
- [ ] Version comparison (diff between languages)
- [ ] Media optimization (auto-compress images)
- [ ] Undo/redo for map editing
- [ ] Collaborative editing (real-time if needed)
- [ ] Tour templates (pre-configured structures)
- [ ] Automated backup/export of tour data

---

## Success Criteria
- ✅ CMS allows creating and managing tours
- ✅ Map editor enables route and point placement
- ✅ Multilingual content management works seamlessly
- ✅ Media upload handles large files (up to 50MB)
- ✅ Voucher system is functional
- ✅ Analytics dashboard displays meaningful data
- ✅ Role-based access control is enforced
- ✅ UI is intuitive for non-technical users

---

## Timeline Estimate
- **Phase 1-2 (Setup + Auth):** Foundation work
- **Phase 3 (Tours CRUD):** Core functionality
- **Phase 4 (Map Editor):** Most complex feature
- **Phase 5-6 (Versions + Localizations):** Content management
- **Phase 7 (Media Upload):** File handling
- **Phase 8 (Vouchers):** Access control
- **Phase 9 (Analytics):** Data visualization
- **Phase 10-11 (Polish + Docs):** Finalization

---

## Current Status
**Phase:** Planning
**Next Step:** Get user approval, then start Phase 1 (Project Setup)
