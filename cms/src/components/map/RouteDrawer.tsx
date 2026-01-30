'use client';

import { useState } from 'react';
import { Pencil, Trash2, Save } from 'lucide-react';

interface RoutePoint {
  lat: number;
  lng: number;
}

interface RouteDrawerProps {
  onRouteComplete: (polyline: string) => void;
  initialRoute?: string | null;
  onDrawingStateChange?: (isDrawing: boolean) => void;
}

export function RouteDrawer({ onRouteComplete, initialRoute, onDrawingStateChange }: RouteDrawerProps) {
  const [isDrawing, setIsDrawing] = useState(false);

  // Get route point count from initialRoute
  const routePointCount = initialRoute ? initialRoute.split(';').length : 0;

  const handleStartDrawing = () => {
    setIsDrawing(true);
    onDrawingStateChange?.(true);
    // Clear the route when starting to draw a new one
    onRouteComplete('');
  };

  const handleClearRoute = () => {
    setIsDrawing(false);
    onDrawingStateChange?.(false);
    onRouteComplete('');
  };

  const handleStopDrawing = () => {
    if (routePointCount < 2) {
      alert('Route must have at least 2 points');
      return;
    }

    setIsDrawing(false);
    onDrawingStateChange?.(false);
  };

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
      <h3 className="text-sm font-medium text-gray-900">Route Tools</h3>

      <div className="flex flex-col space-y-2">
        {!isDrawing ? (
          <button
            onClick={handleStartDrawing}
            className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
          >
            <Pencil size={16} />
            <span>Draw Route</span>
          </button>
        ) : (
          <>
            <button
              onClick={handleStopDrawing}
              disabled={routePointCount < 2}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50"
            >
              <Save size={16} />
              <span>Done ({routePointCount} points)</span>
            </button>
            <button
              onClick={handleClearRoute}
              className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              <Trash2 size={16} />
              <span>Clear</span>
            </button>
          </>
        )}

        {routePointCount > 0 && !isDrawing && (
          <div className="text-xs text-gray-900 mt-2">
            <p>Route: {routePointCount} points</p>
            <p className="mt-1">
              Distance: ~{(routePointCount * 0.1).toFixed(1)} km
            </p>
          </div>
        )}
      </div>

      {isDrawing && (
        <div className="text-xs text-gray-900 mt-2 p-2 bg-blue-50 rounded">
          <p className="font-medium">Drawing Mode:</p>
          <p className="mt-1">Click on the map to add route points</p>
        </div>
      )}
    </div>
  );
}
