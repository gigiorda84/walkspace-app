'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { MapPin } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { MapEditor } from '@/components/map/MapEditor';
import { pointsApi } from '@/lib/api/points';
import { toursApi } from '@/lib/api/tours';

interface NewPointForm {
  triggerRadiusMeters: number;
}

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
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<NewPointForm>({
    defaultValues: {
      triggerRadiusMeters: 150,
    },
  });

  const triggerRadius = watch('triggerRadiusMeters');

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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: NewPointForm & { latitude: number; longitude: number; sequenceOrder: number }) => {
      return pointsApi.createPoint(tourId, data);
    },
    onSuccess: () => {
      router.push(`/tours/${tourId}/points`);
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to create point');
    },
  });

  const onSubmit = (data: NewPointForm) => {
    if (!selectedLocation) {
      setError('Please select a location on the map');
      return;
    }

    setError(null);
    const nextSequenceOrder = existingPoints.length + 1;

    createMutation.mutate({
      ...data,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      sequenceOrder: nextSequenceOrder,
    });
  };

  // Convert selected location to MapPoint for display
  const mapPoints: MapPoint[] = selectedLocation
    ? [
        {
          id: 'new-point',
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          sequenceOrder: existingPoints.length + 1,
          triggerRadiusMeters: triggerRadius,
        },
      ]
    : [];

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <PageHeader
          title="Add New Point"
          description={`${tour?.slug || 'Tour'} - Point ${existingPoints.length + 1}`}
        />

        <div className="p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Map Section */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MapPin size={20} className="mr-2" />
                Select Location
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Click on the map to select the location for this tour point
              </p>

              <div className="h-[500px] border border-gray-200 rounded-lg overflow-hidden relative">
                <MapEditor
                  points={mapPoints}
                  onPointsChange={(points) => {
                    if (points.length > 0) {
                      setSelectedLocation({
                        lat: points[0].latitude,
                        lng: points[0].longitude,
                      });
                    }
                  }}
                  editable={true}
                  center={
                    selectedLocation
                      ? [selectedLocation.lng, selectedLocation.lat]
                      : undefined
                  }
                />

                {selectedLocation && (
                  <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs">
                    <p className="font-medium text-gray-700 mb-1">Selected Location:</p>
                    <p className="text-gray-600">
                      Lat: {selectedLocation.lat.toFixed(6)}
                    </p>
                    <p className="text-gray-600">
                      Lng: {selectedLocation.lng.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Form Section */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Point Settings</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trigger Radius (meters) *
                  </label>
                  <input
                    type="number"
                    {...register('triggerRadiusMeters', {
                      required: 'Trigger radius is required',
                      min: { value: 50, message: 'Minimum radius is 50 meters' },
                      max: { value: 500, message: 'Maximum radius is 500 meters' },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="150"
                  />
                  {errors.triggerRadiusMeters && (
                    <p className="mt-1 text-sm text-red-600">{errors.triggerRadiusMeters.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Distance in meters from the point at which the audio will trigger
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || !selectedLocation}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Point'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
