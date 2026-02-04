# Change Android Map Colors to Dark Green Theme

## Problem
The Android app's map uses dark grey/black colors. We want to change it to a dark green theme to match the brand aesthetic.

## Tasks

- [x] Update `map_style_dark.json` with dark green color values

## File Modified
`android-app/app/src/main/res/raw/map_style_dark.json`

## Review

### Changes Made

Updated the Google Maps style JSON file with dark green colors:

| Element | Old Color | New Color |
|---------|-----------|-----------|
| Base geometry | #212121 (dark grey) | #0D1F12 (dark forest green) |
| Label stroke | #212121 | #0D1F12 |
| Roads (fill) | #2c2c2c | #1A2E1C |
| Arterial roads | #373737 | #243827 |
| Highways | #3c3c3c | #2A4030 |
| Controlled access highways | #4e4e4e | #3A5040 |
| Parks | #181818 | #0A1A0D |
| Park label stroke | #1b1b1b | #0D180F |
| Water | #000000 | #081510 (dark teal-green) |

**Unchanged**: All text label fill colors remain grey (#757575, #8a8a8a, etc.) for readability against the green backgrounds.

### Impact
- Both Discovery screen and Player screen maps use this same style file
- Route polylines, markers, and tour point overlays are unaffected (they use app-defined colors)

### Testing Required
1. Build and run the Android app
2. Open Discovery screen - verify dark green map background
3. Start a tour - verify dark green map in Player screen
4. Confirm text labels are readable
5. Verify route polylines and markers are visible
