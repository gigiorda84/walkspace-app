'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { MapEditor } from '@/components/map/MapEditor';
import { PointsManager } from '@/components/map/PointsManager';
import { RouteDrawer } from '@/components/map/RouteDrawer';

interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  sequenceOrder: number;
  triggerRadiusMeters: number;
}

export default function MapTestPage() {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [route, setRoute] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  const handleRouteComplete = (polyline: string) => {
    setRoute(polyline);
    console.log('Route saved:', polyline);
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <PageHeader
          title="Map Editor Test"
          description="Interactive map for route and point management"
        />

        <div className="h-[calc(100vh-8rem)] relative">
          <MapEditor
            points={points}
            onPointsChange={setPoints}
            routePolyline={route}
            onRouteChange={setRoute}
            editable={true}
          />

          <RouteDrawer
            onRouteComplete={handleRouteComplete}
            initialRoute={route}
          />

          <PointsManager
            points={points}
            onPointsChange={setPoints}
            onPointSelect={setSelectedPoint}
          />

          {/* Debug info */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 text-xs">
            <p><strong>Points:</strong> {points.length}</p>
            <p><strong>Route:</strong> {route ? 'Set' : 'Not set'}</p>
            {selectedPoint && (
              <p className="mt-1 text-indigo-600">
                <strong>Selected:</strong> Point {selectedPoint.sequenceOrder}
              </p>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
