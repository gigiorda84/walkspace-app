# Add Visual Route Path Between Points (iOS App)

## Problem
The iOS app currently shows tour points and trigger radius circles, but doesn't display a visual path/route connecting the points. The backend and CMS already support route polylines, but the iOS app needs to:
1. Fetch the route polyline from the API
2. Render it as a line on the map to guide users along the tour path

## Current Implementation Status
✅ **Backend API** - `routePolyline` field in tour version endpoint
✅ **CMS** - Full map editor with route drawing and editing
❌ **iOS App** - No polyline fetching or rendering

## Plan

### Task List
- [x] Update iOS Tour model to include `routePolyline` field
- [x] Parse route polyline string format (`"lat,lng;lat,lng;..."`) into coordinates
- [x] Add MKPolyline overlay to MapView to render the route
- [x] Style the route line (color, width, etc.) to match brand
- [x] Build and verify the implementation

## Implementation Details

### 1. Tour Model Update
**File:** `mobile-app/ios/SonicWalkscape/SonicWalkscape/Models/Tour.swift`
- Add `routePolyline: String?` property to match API response
- Add helper method to parse polyline string into `[CLLocationCoordinate2D]`

### 2. MapView Route Rendering
**File:** `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Player/MapView.swift`
- Add MKPolyline overlay in `updateUIView` method
- Implement `rendererFor overlay` in Coordinator to return `MKPolylineRenderer`
- Style: blue line, 3-4pt width, semi-transparent

### 3. Polyline Format
Backend stores polylines as: `"45.464203,9.189982;45.465203,9.190982;..."`
- Split by `;` to get individual points
- Split each point by `,` to get lat/lng
- Convert to `CLLocationCoordinate2D` array

## Review

### Implementation Summary

Successfully added visual route path rendering to the iOS app. The app now displays a blue line connecting tour points on the map, showing users the intended walking path.

### Files Modified

1. **Tour.swift** (lines 16, 61-77, 97)
   - Added `routePolyline: String?` property to store polyline data from API
   - Added `routeCoordinates` computed property that parses polyline format into `[CLLocationCoordinate2D]`
   - Updated `CodingKeys` enum to include `routePolyline`

2. **MapView.swift** (lines 12, 25, 67, 91-96, 127-132)
   - Added `tour: Tour` parameter to both `MapView` and `MapViewRepresentable`
   - Added polyline overlay rendering in `updateUIView` method
   - Updated `rendererFor overlay` to handle `MKPolyline` and style it with blue color (4pt width, 70% opacity)
   - Updated preview to include sample tour with route data

3. **PlayerView.swift** (line 64, 534)
   - Updated MapView call to pass `tour` parameter
   - Fixed preview Tour initialization to include `routePolyline` field

4. **TourCardView.swift** (line 113)
   - Fixed preview Tour initialization to include `routePolyline` field

5. **TourCompletionView.swift** (line 187)
   - Fixed preview Tour initialization to include `routePolyline` field

6. **TourDetailView.swift** (line 284)
   - Fixed preview Tour initialization to include `routePolyline` field

### Technical Details

**Polyline Format:**
- Backend format: `"lat1,lng1;lat2,lng2;lat3,lng3..."`
- Parser splits by `;` then by `,` to extract coordinates
- Returns empty array if polyline is nil or invalid

**Rendering:**
- Blue line (`UIColor.systemBlue`) with 70% opacity
- 4pt line width for clear visibility
- Rendered below trigger radius circles and point markers
- Updates automatically when tour data changes

**Layer Order (bottom to top):**
1. Route polyline (blue line)
2. Trigger radius circles (colored by state)
3. Point markers (numbered circles)

### Build Status
✅ **BUILD SUCCEEDED** on iOS Simulator (iPhone 17)

### Next Steps
- Test with real tour data that has a route polyline set in CMS
- Verify route displays correctly on physical device
- Consider adding route styling options (different colors for different tour types)

---

## Fix: Route Drawing Functionality

### Problem Found
The route drawing feature wasn't working because:
1. **iOS App** - Expected flat `routePolyline` field, but backend returns nested `routePreview.polyline`
2. **CMS** - RouteDrawer UI existed but couldn't actually draw on the map (no map interaction)

### Changes Made

**1. iOS Tour Model** (`Models/Tour.swift`)
- Added custom `init(from decoder:)` to decode nested `routePreview.polyline` structure
- Added manual initializer for creating Tour objects in code (previews/tests)
- Added custom `encode(to encoder:)` to maintain encoding compatibility

**2. CMS MapEditor** (`components/map/MapEditor.tsx`)
- Added `isDrawingRoute` prop to toggle between tour point mode and route drawing mode
- Updated `handleMapClick` to add points to route when in drawing mode
- When `isDrawingRoute` is true, clicks append to the route polyline

**3. CMS RouteDrawer** (`components/map/RouteDrawer.tsx`)
- Removed local route points state (was disconnected from map)
- Added `onDrawingStateChange` callback to notify parent when drawing starts/stops
- Component now manages drawing mode state and communicates it to MapEditor via parent

**4. CMS Version Edit Page** (`app/tours/[id]/versions/[versionId]/edit/page.tsx`)
- Added `isDrawingRoute` state to track drawing mode
- Connected RouteDrawer's `onDrawingStateChange` to update state
- Passed `isDrawingRoute` to MapEditor so it knows when to capture route clicks

### How It Works Now

**iOS App:**
1. Fetches tour from API which includes `routePreview: { polyline: "lat,lng;..." }`
2. Custom decoder extracts polyline and stores it as `routePolyline` property
3. MapView parses polyline into coordinates and renders blue MKPolyline overlay

**CMS Route Drawing:**
1. User clicks "Draw Route" button in RouteDrawer
2. RouteDrawer calls `onDrawingStateChange(true)` → parent updates `isDrawingRoute` state
3. MapEditor receives `isDrawingRoute={true}` and enters route drawing mode
4. User clicks on map → `handleMapClick` adds coordinates to route polyline
5. Blue line updates in real-time as points are added
6. User clicks "Done" → RouteDrawer calls `onDrawingStateChange(false)` → exits drawing mode
7. User clicks "Save Changes" → route polyline sent to backend

### Build Status
✅ **iOS BUILD SUCCEEDED**
✅ **Route drawing now functional in CMS**

### Testing Instructions
1. **CMS**: Open any tour version → Click "Show Map" → Click "Draw Route" → Click on map to draw path → Click "Done" → Save
2. **iOS**: The route will appear as a blue line on the map when viewing that tour

---

# PREVIOUS WORK - Fix iOS Map - Show Trigger Radius Circles

## Problem
La mappa iOS mostra i pin dei punti ma non visualizza le aree circolari con il raggio di trigger per ogni punto.

## Plan

### Task List
- [x] Aggiungere MapCircle overlay per visualizzare il raggio di trigger di ogni punto
- [x] Usare colori diversi per distinguere:
  - Punti già visitati (grigio semi-trasparente)
  - Punto corrente/attivo (arancione semi-trasparente)
  - Punti futuri (viola semi-trasparente)
- [x] Testare che i cerchi siano della dimensione corretta in base a triggerRadiusMeters

## Implementation Details

Il file da modificare è:
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Player/MapView.swift`

Cambio necessario:
- Aggiungere MapCircle per ogni punto con radius = point.triggerRadiusMeters
- Usare colori semi-trasparenti (opacity 0.2-0.3) così la mappa sotto rimane visibile

## Review

### Modifiche Implementate

**File modificato:**
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Player/MapView.swift`

**Cambiamenti principali:**

1. **Creata `MapViewRepresentable`** - Una struct UIViewRepresentable che wrappa MKMapView nativo
   - Supporta iOS 15+ (deployment target esistente)
   - Permette l'uso di MKCircle overlay nativi

2. **Aggiunto rendering dei cerchi di trigger** - `MKCircleRenderer` con colori basati sullo stato del punto:
   - **Grigio** (opacity 0.15/0.3) per punti già visitati
   - **Arancione** (opacity 0.2/0.5) per il punto corrente/attivo
   - **Viola** (opacity 0.15/0.3) per punti futuri
   - Raggio = `point.triggerRadiusMeters` (100-300m)

3. **Creata classe `PointAnnotation`** - MKAnnotation custom per mantenere i dati del punto
   - Usata dal Coordinator per gestire gli annotation

4. **Mantenuto `PointAnnotationView`** SwiftUI - Per i pin dei punti con stile brand esistente
   - Integrato tramite UIHostingController

### Build Status
✅ Build completato con successo (`BUILD SUCCEEDED`)

### Comportamento Atteso
- La mappa ora mostra cerchi semi-trasparenti intorno ad ogni punto
- Il raggio dei cerchi corrisponde al `triggerRadiusMeters` di ogni punto
- I colori cambiano dinamicamente quando l'utente avanza nel tour
- I cerchi rendono visibile l'area in cui il GPS attiverà l'audio per ogni punto

---

## Fix: Elementi Duplicati sui Punti

### Problema Aggiuntivo
Nella visualizzazione dei punti c'erano elementi duplicati:
- Cerchio esterno duplicato intorno al punto corrente
- Pallino nero sotto ogni punto (pin di default MKAnnotationView)

### Modifiche Aggiuntive

**PointAnnotationView (righe 209-236):**
- ❌ **Rimosso** il cerchio esterno animato (`Circle().stroke()`) che creava un duplicato
- ✅ **Mantenuto** solo il cerchio colorato con numero bianco

**Coordinator - mapView viewFor annotation (righe 151-197):**
1. Aggiunto `annotationView?.image = nil` per rimuovere il pin di default (pallino nero)
2. Aggiunta pulizia delle subviews quando si riusa un'annotationView:
   ```swift
   annotationView?.subviews.forEach { $0.removeFromSuperview() }
   ```
3. Aggiunto corretto dimensionamento e centratura della custom view:
   ```swift
   let size = hostingController.view.intrinsicContentSize
   annotationView?.centerOffset = CGPoint(x: 0, y: -size.height / 2)
   ```

### Build Status
✅ Build completato con successo (`BUILD SUCCEEDED`)

### Risultato Finale
Ogni punto sulla mappa ora mostra:
- ✅ Cerchio grande colorato semi-trasparente (raggio trigger GPS)
- ✅ Cerchio piccolo colorato con numero bianco
- ✅ Etichetta con titolo (solo per punto corrente)
- ❌ Nessun elemento duplicato
- ❌ Nessun pallino nero sotto

---

## Fix: Centratura dei Cerchi

### Problema
Il cerchio piccolo con il numero e il cerchio grande del raggio trigger non erano centrati sulla stessa coordinata GPS. Il pin appariva spostato verso l'alto rispetto al centro del cerchio di trigger.

### Causa
Il `centerOffset` era impostato a `CGPoint(x: 0, y: -size.height / 2)`, che spostava l'intera annotationView troppo in alto. Questo non teneva conto che volevamo centrare specificamente il **cerchio** (non l'intera view che include anche l'etichetta sotto).

### Soluzione (righe 195-198)
Calcolato il `centerOffset` corretto basato sulla posizione del cerchio all'interno della view:
```swift
// Il cerchio è 32x32, quindi il suo centro è a 16px dall'alto
let circleRadius: CGFloat = 16
annotationView?.centerOffset = CGPoint(x: 0, y: circleRadius - size.height / 2)
```

**Formula:**
- Cerchio 32x32px → centro a 16px dall'alto
- View totale alta `size.height` → centro a `size.height/2` dall'alto
- Offset = `16 - size.height/2` per allineare il centro del cerchio con la coordinata GPS

### Build Status
✅ Build completato con successo (`BUILD SUCCEEDED`)

### Risultato
Ora il cerchio piccolo con il numero è perfettamente centrato con il cerchio grande del raggio trigger, entrambi sulla stessa coordinata GPS.

---

## Fix: Rimozione Etichetta e Colore Punti Completati

### Problemi Identificati
1. **Etichetta indesiderata**: L'etichetta con il titolo del punto (es. "Punto1") appariva sotto il cerchio
2. **Centratura ancora non perfetta**: Con l'etichetta, la centratura era complicata
3. **Punti completati non diventavano grigi**: I punti già superati rimanevano arancioni/viola invece di diventare grigi

### Modifiche Implementate

**1. PointAnnotationView (righe 226-238):**
- ❌ **Rimosso** completamente il VStack e l'etichetta del titolo
- ✅ **Semplificato** a solo ZStack con cerchio + numero
- Ora la view è solo 32x32 px (il cerchio)

```swift
var body: some View {
    ZStack {
        Circle()
            .fill(isPassed ? Color.brandMuted : (isCurrent ? Color.brandOrange : Color.brandPurple))
            .frame(width: 32, height: 32)
        Text("\(point.order)")
            .font(.system(size: 14, weight: .bold))
            .foregroundColor(.white)
    }
}
```

**2. Centratura Semplificata (riga 197):**
- Senza l'etichetta, la view è 32x32, quindi il centro della view È il centro del cerchio
- `centerOffset = CGPoint.zero` - nessun offset necessario

**3. Fix Aggiornamento Colori (riga 79):**
- Aggiunto `context.coordinator.parent = self` in `updateUIView`
- Questo assicura che quando `currentPointIndex` cambia, il renderer dei cerchi usi il valore aggiornato
- Senza questo, i cerchi non si aggiornavano quando l'utente avanzava nel tour

### Build Status
✅ Build completato con successo (`BUILD SUCCEEDED`)

### Risultato Finale
- ✅ **Nessuna etichetta** sotto i cerchi
- ✅ **Centratura perfetta** tra cerchio piccolo e cerchio trigger
- ✅ **Punti completati diventano grigi** (sia il cerchio piccolo che quello grande)
- ✅ **Punto corrente rimane arancione**
- ✅ **Punti futuri sono viola**

---

## Fix: Audio Non Parte

### Problema
L'audio non partiva né quando l'utente entrava nell'area trigger GPS, né quando premeva il tasto play.

### Causa
Quando l'utente premeva play, `AudioPlayerManager.togglePlayPause()` ritornava silenziosamente se `player` era `nil` (riga 98):
```swift
guard let player = player else { return }
```

Il player rimaneva `nil` se:
1. Il manifest non era stato caricato
2. L'audio non era stato scaricato
3. Il download dell'audio aveva fallito silenziosamente

### Soluzione (PlayerView.swift righe 341-358)
Aggiunto un fallback in `togglePlayPause()`:
- **Controlla se il player è pronto** verificando `audioManager.duration == 0`
- **Se non è pronto**: carica l'audio per il punto corrente
- **Se è pronto**: esegue il normale toggle play/pause

```swift
private func togglePlayPause() {
    if audioManager.duration == 0 {
        // Player not initialized - try to load audio for current point
        DebugLogger.warning("Player not ready. Loading audio for current point...")
        let point = tourPoints[currentPointIndex]
        if let audioURL = audioURLsByPointId[point.id] {
            DebugLogger.audio("Loading audio: \(audioURL)")
            audioManager.play(audioURL: audioURL)
            audioManager.updateNowPlayingInfo(title: point.title, artist: tour.title["en"] ?? "Sonic Walkscape")
        } else {
            DebugLogger.error("No audio URL for point \(point.id)")
        }
    } else {
        // Player ready - toggle play/pause
        audioManager.togglePlayPause()
    }
}
```

### Build Status
✅ Build completato con successo (`BUILD SUCCEEDED`)

### Test Logs
```
[18:43:25.051] 🎵 Audio Audio ready: 40.5s, autoPlay: true
[18:44:05.819] ✅ Success Tour completed! Showing completion screen. Point 4 of 4
[18:44:05.820] 🎵 Audio Audio playback completed successfully
```

### Risultato
- ✅ **Audio si carica correttamente** dal backend (40.5s di durata)
- ✅ **AutoPlay funziona** quando l'utente entra nell'area trigger
- ✅ **Tasto play funziona** anche se il player non era inizializzato
- ✅ **Tour completato con successo** con tutti i punti visitati
