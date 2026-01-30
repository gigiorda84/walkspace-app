'use client';

import React, { useRef, useState, useEffect } from 'react';
import Map, { MapRef, Marker, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre';
import circle from '@turf/circle';
import { Crosshair, Layers } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
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
  isDrawingRoute?: boolean;
}

const MAP_STYLES = {
  streets: {
    name: 'Streets',
    url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  },
  satellite: {
    name: 'Satellite',
    url: 'https://api.maptiler.com/maps/hybrid/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL',
  },
  terrain: {
    name: 'Terrain',
    url: 'https://api.maptiler.com/maps/outdoor/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL',
  },
  dark: {
    name: 'Dark',
    url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
} as const;

type MapStyleKey = keyof typeof MAP_STYLES;

export function MapEditor({
  points = [],
  onPointsChange,
  routePolyline,
  onRouteChange,
  editable = true,
  center = [12.4964, 41.9028], // Default to Rome
  zoom = 13,
  onMarkerClick,
  isDrawingRoute = false,
}: MapEditorProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyleKey>('streets');
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: center[0],
    latitude: center[1],
    zoom: zoom,
  });

  // Get user's location
  const { position: userLocation, loading: locationLoading, refetch: refetchLocation } = useGeolocation();

  const handleMapClick = (event: MapLayerMouseEvent) => {
    if (!editable || isDragging) return;

    const { lng, lat } = event.lngLat;

    // If in route drawing mode, add point to route
    if (isDrawingRoute && onRouteChange) {
      const currentPoints = routePolyline
        ? routePolyline.split(';').map(pair => {
            const [pLat, pLng] = pair.split(',');
            return { lat: pLat, lng: pLng };
          })
        : [];

      currentPoints.push({ lat: lat.toString(), lng: lng.toString() });
      const newPolyline = currentPoints.map(p => `${p.lat},${p.lng}`).join(';');
      onRouteChange(newPolyline);
      return;
    }

    // Otherwise, add tour point
    if (onPointsChange) {
      const newPoint: MapPoint = {
        id: `temp-${Date.now()}`,
        latitude: lat,
        longitude: lng,
        sequenceOrder: points.length + 1,
        triggerRadiusMeters: 150,
      };
      onPointsChange([...points, newPoint]);
    }
  };

  const centerOnUserLocation = () => {
    if (!mapRef.current || !userLocation) return;

    mapRef.current.flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: 15,
      duration: 1000,
    });
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
        mapStyle={MAP_STYLES[mapStyle].url}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Zoom controls - positioned at bottom right */}
        <NavigationControl position="bottom-right" showCompass={false} />

        {/* Custom Controls - positioned at top right */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {/* Center on location button */}
          <button
            onClick={() => {
              if (!userLocation) {
                refetchLocation();
              } else {
                centerOnUserLocation();
              }
            }}
            disabled={locationLoading}
            className="bg-white p-2 rounded shadow-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300"
            title="Center on my location"
          >
            <Crosshair size={20} className={locationLoading ? 'animate-spin' : ''} />
          </button>

          {/* Map style switcher */}
          <div className="relative">
            <button
              onClick={() => setShowStyleMenu(!showStyleMenu)}
              className="bg-white p-2 rounded shadow-lg hover:bg-gray-50 border border-gray-300"
              title="Change map style"
            >
              <Layers size={20} />
            </button>

            {showStyleMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded shadow-lg border border-gray-300 min-w-[120px] z-10">
                {(Object.keys(MAP_STYLES) as MapStyleKey[]).map((styleKey) => (
                  <button
                    key={styleKey}
                    onClick={() => {
                      setMapStyle(styleKey);
                      setShowStyleMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-sm ${
                      mapStyle === styleKey ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-900'
                    }`}
                  >
                    {MAP_STYLES[styleKey].name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

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

        {/* User location marker */}
        {userLocation && (
          <>
            {/* Accuracy circle */}
            <Source
              id="user-location-accuracy"
              type="geojson"
              data={circle(
                [userLocation.longitude, userLocation.latitude],
                userLocation.accuracy / 1000,
                { steps: 64, units: 'kilometers' }
              )}
            >
              <Layer
                id="user-location-accuracy-fill"
                type="fill"
                paint={{
                  'fill-color': '#3B82F6',
                  'fill-opacity': 0.1,
                }}
              />
            </Source>

            {/* User location marker */}
            <Marker
              longitude={userLocation.longitude}
              latitude={userLocation.latitude}
            >
              <div className="relative">
                {/* Outer pulse ring */}
                <div className="absolute -inset-2 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                {/* Dot */}
                <div className="relative w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
              </div>
            </Marker>
          </>
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
