'use client';

import React, { useRef, useState, useEffect } from 'react';
import Map, { MapRef, Marker, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre';
import circle from '@turf/circle';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  sequenceOrder: number;
  triggerRadiusMeters: number;
}

interface MapEditorProps {
  points?: MapPoint[];
  onPointsChange?: (points: MapPoint[]) => void;
  routePolyline?: string | null;
  onRouteChange?: (polyline: string) => void;
  editable?: boolean;
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (pointId: string) => void;
}

export function MapEditor({
  points = [],
  onPointsChange,
  routePolyline,
  onRouteChange,
  editable = true,
  center = [12.4964, 41.9028], // Default to Rome
  zoom = 13,
  onMarkerClick,
}: MapEditorProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: center[0],
    latitude: center[1],
    zoom: zoom,
  });

  const handleMapClick = (event: MapLayerMouseEvent) => {
    if (!editable || !onPointsChange || isDragging) return;

    const { lng, lat } = event.lngLat;
    const newPoint: MapPoint = {
      id: `temp-${Date.now()}`,
      latitude: lat,
      longitude: lng,
      sequenceOrder: points.length + 1,
      triggerRadiusMeters: 150,
    };

    onPointsChange([...points, newPoint]);
  };

  // Auto-fit map bounds to show all points
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || points.length === 0) return;

    // Small delay to ensure map is fully ready
    const timer = setTimeout(() => {
      if (!mapRef.current) return;

      // Calculate bounding box from all points
      const lngs = points.map(p => p.longitude);
      const lats = points.map(p => p.latitude);

      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);

      // Fit bounds with padding
      mapRef.current.fitBounds(
        [
          [minLng, minLat], // Southwest corner
          [maxLng, maxLat], // Northeast corner
        ],
        {
          padding: 80, // Add padding around the bounds
          duration: 1000, // Smooth animation
        }
      );
    }, 100);

    return () => clearTimeout(timer);
  }, [points, mapLoaded]);

  // Convert polyline string to coordinates array
  const getRouteCoordinates = () => {
    if (!routePolyline) return [];

    try {
      // Assuming polyline is in format: "lat1,lng1;lat2,lng2;..."
      return routePolyline.split(';').map(pair => {
        const [lat, lng] = pair.split(',').map(Number);
        return [lng, lat]; // GeoJSON uses [lng, lat]
      });
    } catch (error) {
      return [];
    }
  };

  const routeCoordinates = getRouteCoordinates();

  return (
    <div className="w-full h-full relative">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        onLoad={() => setMapLoaded(true)}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Zoom controls */}
        <NavigationControl position="top-right" showCompass={false} />

        {/* Route polyline */}
        {routeCoordinates.length > 0 && (
          <Source
            id="route"
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routeCoordinates,
              },
            }}
          >
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': '#4F46E5',
                'line-width': 4,
                'line-opacity': 0.8,
              }}
            />
          </Source>
        )}

        {/* Point markers with trigger radius */}
        {points.map((point, index) => {
          // Create a circle polygon with the trigger radius in meters
          const radiusCircle = circle(
            [point.longitude, point.latitude],
            point.triggerRadiusMeters / 1000, // Convert meters to kilometers
            { steps: 64, units: 'kilometers' }
          );

          return (
            <React.Fragment key={point.id}>
              {/* Trigger radius circle */}
              <Source
                id={`radius-${point.id}`}
                type="geojson"
                data={radiusCircle}
              >
                <Layer
                  id={`radius-fill-${point.id}`}
                  type="fill"
                  paint={{
                    'fill-color': '#4F46E5',
                    'fill-opacity': 0.1,
                  }}
                />
                <Layer
                  id={`radius-outline-${point.id}`}
                  type="line"
                  paint={{
                    'line-color': '#4F46E5',
                    'line-width': 2,
                    'line-opacity': 0.5,
                  }}
                />
              </Source>

              {/* Point marker */}
              <Marker
                longitude={point.longitude}
                latitude={point.latitude}
                draggable={editable}
                onDragStart={() => {
                  setIsDragging(true);
                }}
                onDrag={() => {
                  setIsDragging(true);
                }}
                onDragEnd={(event) => {
                  if (!onPointsChange) return;
                  const updatedPoints = points.map((p) =>
                    p.id === point.id
                      ? { ...p, latitude: event.lngLat.lat, longitude: event.lngLat.lng }
                      : p
                  );
                  onPointsChange(updatedPoints);
                  // Reset dragging state after a small delay to prevent click event
                  setTimeout(() => setIsDragging(false), 100);
                }}
              >
                <div
                  onClick={() => onMarkerClick?.(point.id)}
                  className="flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-full border-4 border-white shadow-lg cursor-pointer hover:bg-indigo-700"
                >
                  <span className="text-sm font-bold">{point.sequenceOrder}</span>
                </div>
              </Marker>
            </React.Fragment>
          );
        })}
      </Map>
    </div>
  );
}
