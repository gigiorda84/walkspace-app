'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { MapEditor } from '@/components/map/MapEditor';
import { PointsManager } from '@/components/map/PointsManager';
import { pointsApi } from '@/lib/api/points';
import { toursApi } from '@/lib/api/tours';

interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  sequenceOrder: number;
  triggerRadiusMeters: number;
}

export default function NewPointPage() {
  const params = useParams();
  const router = useRouter();
  const tourId = params.id as string;

  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState('');

  // Fetch tour details
  const { data: tour } = useQuery({
    queryKey: ['tour', tourId],
    queryFn: () => toursApi.getTour(tourId),
  });

  // Fetch existing points to determine sequence order
  const { data: existingPoints = [] } = useQuery({
    queryKey: ['tour-points', tourId],
    queryFn: () => pointsApi.getPointsByTour(tourId),
  });

  // Bulk save handler
  const onSubmit = async () => {
    if (points.length === 0) {
      setError('Please add at least one point on the map');
      return;
    }

    setError(null);
    setIsSaving(true);
    let savedCount = 0;

    try {
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        setSavingProgress(`Saving point ${i + 1} of ${points.length}...`);

        await pointsApi.createPoint(tourId, {
          latitude: point.latitude,
          longitude: point.longitude,
          sequenceOrder: existingPoints.length + i + 1,
          triggerRadiusMeters: point.triggerRadiusMeters,
        });

        savedCount++;
      }

      // All points saved successfully
      router.push(`/tours/${tourId}/points`);
    } catch (err: any) {
      setError(`Failed to save point ${savedCount + 1}: ${err.message || 'Unknown error'}`);
      setIsSaving(false);
      setSavingProgress('');
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <PageHeader
          title="Add Points"
          description={`Add multiple tour points for ${tour?.slug || 'this tour'}`}
        />

        <div className="p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {savingProgress && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-600">{savingProgress}</p>
              </div>
            )}

            {/* Map Section */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MapPin size={20} className="mr-2" />
                Select Locations
              </h2>
              <p className="text-sm text-gray-900 mb-4">
                Click on the map to add multiple points. Drag markers to reposition, use the sidebar to manage.
              </p>

              <div className="h-[500px] border border-gray-200 rounded-lg overflow-hidden relative">
                <MapEditor
                  points={points}
                  onPointsChange={setPoints}
                  editable={true}
                />
                <PointsManager
                  points={points}
                  onPointsChange={setPoints}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {points.length === 0 ? 'No points added yet' : `${points.length} point${points.length > 1 ? 's' : ''} ready to save`}
                  </h2>
                  <p className="text-sm text-gray-900 mt-1">
                    {points.length === 0
                      ? 'Click on the map to add your first point'
                      : 'You can add more points or save now'}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSubmit}
                    disabled={isSaving || points.length === 0}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save All Points'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
