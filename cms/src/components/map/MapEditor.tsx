'use client';

import { useRef, useState, useEffect } from 'react';
import Map, { MapRef, Marker, Source, Layer } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre';
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
}

export function MapEditor({
  points = [],
  onPointsChange,
  routePolyline,
  onRouteChange,
  editable = true,
  center = [12.4964, 41.9028], // Default to Rome
  zoom = 13,
}: MapEditorProps) {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: center[0],
    latitude: center[1],
    zoom: zoom,
  });

  const handleMapClick = (event: MapLayerMouseEvent) => {
    if (!editable || !onPointsChange) return;

    const { lng, lat } = event.lngLat;
    const newPoint: MapPoint = {
      id: `point-${Date.now()}`,
      latitude: lat,
      longitude: lng,
      sequenceOrder: points.length + 1,
      triggerRadiusMeters: 150,
    };

    onPointsChange([...points, newPoint]);
  };

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
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
      >
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
        {points.map((point, index) => (
          <div key={point.id}>
            {/* Trigger radius circle */}
            <Source
              id={`radius-${point.id}`}
              type="geojson"
              data={{
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: [point.longitude, point.latitude],
                },
              }}
            >
              <Layer
                id={`radius-circle-${point.id}`}
                type="circle"
                paint={{
                  'circle-radius': {
                    stops: [
                      [0, 0],
                      [20, point.triggerRadiusMeters / 2],
                    ],
                    base: 2,
                  },
                  'circle-color': '#4F46E5',
                  'circle-opacity': 0.1,
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#4F46E5',
                  'circle-stroke-opacity': 0.3,
                }}
              />
            </Source>

            {/* Point marker */}
            <Marker
              longitude={point.longitude}
              latitude={point.latitude}
              draggable={editable}
              onDragEnd={(event) => {
                if (!onPointsChange) return;
                const updatedPoints = points.map((p) =>
                  p.id === point.id
                    ? { ...p, latitude: event.lngLat.lat, longitude: event.lngLat.lng }
                    : p
                );
                onPointsChange(updatedPoints);
              }}
            >
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-full border-4 border-white shadow-lg cursor-pointer hover:bg-indigo-700">
                <span className="text-sm font-bold">{point.sequenceOrder}</span>
              </div>
            </Marker>
          </div>
        ))}
      </Map>

      {editable && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium text-gray-700">Click on map to add points</p>
          <p className="text-gray-500 text-xs mt-1">Drag markers to reposition</p>
        </div>
      )}
    </div>
  );
}
