# Add Route Drawing/Editing to Unified Editor

## Current State
The unified editor (`cms/src/app/tours/[id]/editor/page.tsx`) already has:
- MapEditor component that displays routes
- RouteDrawer component for drawing
- Save mutation that saves to tour
- State management for drawing mode

## Goal
Make route drawing more intuitive with clear controls:
1. "Draw Route" button to start drawing mode
2. "Clear Route" button to reset
3. "Save Route" button (already exists but improve visibility)
4. Visual feedback when in drawing mode

## Tasks
- [ ] Add prominent "Draw Route" button
- [ ] Add "Clear Route" button
- [ ] Improve visual feedback during drawing
- [ ] Test drawing and saving workflow

## Changes Needed
File: `cms/src/app/tours/[id]/editor/page.tsx`
- Add button controls for drawing/clearing
- Make the drawing workflow clearer
- Ensure save button is always accessible
