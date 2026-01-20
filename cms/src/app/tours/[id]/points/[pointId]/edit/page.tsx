'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { MapPin } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { MapEditor } from '@/components/map/MapEditor';
import { pointsApi } from '@/lib/api/points';
import { toursApi } from '@/lib/api/tours';

interface EditPointForm {
  latitude: number;
  longitude: number;
  triggerRadiusMeters: number;
  sequenceOrder: number;
}

interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  sequenceOrder: number;
  triggerRadiusMeters: number;
}

export default function EditPointPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tourId = params.id as string;
  const pointId = params.pointId as string;

  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<EditPointForm>();

  const triggerRadius = watch('triggerRadiusMeters');
  const latitude = watch('latitude');
  const longitude = watch('longitude');

  // Fetch tour details
  const { data: tour } = useQuery({
    queryKey: ['tour', tourId],
    queryFn: () => toursApi.getTour(tourId),
  });

  // Fetch point details
  const { data: point, isLoading: isPointLoading } = useQuery({
    queryKey: ['tour-point', tourId, pointId],
    queryFn: () => pointsApi.getPoint(tourId, pointId),
  });

  // Initialize form when point data loads
  useEffect(() => {
    if (point) {
      reset({
        latitude: point.latitude,
        longitude: point.longitude,
        triggerRadiusMeters: point.triggerRadiusMeters,
        sequenceOrder: point.sequenceOrder,
      });
      setSelectedLocation({
        lat: point.latitude,
        lng: point.longitude,
      });
    }
  }, [point, reset]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: EditPointForm) => {
      // Transform frontend field names to backend field names
      const backendData = {
        lat: data.latitude,
        lng: data.longitude,
        order: data.sequenceOrder,
        defaultTriggerRadiusMeters: data.triggerRadiusMeters,
      };
      return pointsApi.updatePoint(tourId, pointId, backendData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-points', tourId] });
      queryClient.invalidateQueries({ queryKey: ['tour-point', tourId, pointId] });
      router.push(`/tours/${tourId}/points`);
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to update point');
    },
  });

  const onSubmit = (data: EditPointForm) => {
    if (!selectedLocation) {
      setError('Please select a location on the map');
      return;
    }

    setError(null);
    // Pass frontend field names - mutation will transform them
    updateMutation.mutate({
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      triggerRadiusMeters: Number(data.triggerRadiusMeters),
      sequenceOrder: Number(data.sequenceOrder),
    });
  };

  // Convert selected location to MapPoint for display
  const mapPoints: MapPoint[] = selectedLocation && triggerRadius
    ? [
        {
          id: pointId,
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          sequenceOrder: point?.sequenceOrder || 1,
          triggerRadiusMeters: triggerRadius,
        },
      ]
    : [];

  if (isPointLoading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <PageHeader
          title="Edit Point"
          description={`${tour?.slug || 'Tour'} - Point ${point?.sequenceOrder || ''}`}
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
                Location
              </h2>
              <p className="text-sm text-gray-900 mb-4">
                Click on the map or drag the marker to update the location
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
                    <p className="font-medium text-gray-900 mb-1">Current Location:</p>
                    <p className="text-gray-900">
                      Lat: {selectedLocation.lat.toFixed(6)}
                    </p>
                    <p className="text-gray-900">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Latitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      {...register('latitude', {
                        required: 'Latitude is required',
                        min: { value: -90, message: 'Latitude must be between -90 and 90' },
                        max: { value: 90, message: 'Latitude must be between -90 and 90' },
                      })}
                      onChange={(e) => {
                        const lat = parseFloat(e.target.value);
                        if (!isNaN(lat) && longitude) {
                          setSelectedLocation({ lat, lng: longitude });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.latitude && (
                      <p className="mt-1 text-sm text-red-600">{errors.latitude.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Longitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      {...register('longitude', {
                        required: 'Longitude is required',
                        min: { value: -180, message: 'Longitude must be between -180 and 180' },
                        max: { value: 180, message: 'Longitude must be between -180 and 180' },
                      })}
                      onChange={(e) => {
                        const lng = parseFloat(e.target.value);
                        if (!isNaN(lng) && latitude) {
                          setSelectedLocation({ lat: latitude, lng });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.longitude && (
                      <p className="mt-1 text-sm text-red-600">{errors.longitude.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Trigger Radius (meters) *
                    </label>
                    <input
                      type="number"
                      {...register('triggerRadiusMeters', {
                        required: 'Trigger radius is required',
                        min: { value: 5, message: 'Minimum radius is 5 meters' },
                        max: { value: 500, message: 'Maximum radius is 500 meters' },
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.triggerRadiusMeters && (
                      <p className="mt-1 text-sm text-red-600">{errors.triggerRadiusMeters.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-900">
                      Distance in meters from the point at which the audio will trigger
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Sequence Order *
                    </label>
                    <input
                      type="number"
                      {...register('sequenceOrder', {
                        required: 'Sequence order is required',
                        min: { value: 1, message: 'Minimum sequence order is 1' },
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.sequenceOrder && (
                      <p className="mt-1 text-sm text-red-600">{errors.sequenceOrder.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-900">
                      Order in which this point appears in the tour
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending || !selectedLocation}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {updateMutation.isPending ? 'Updating...' : 'Update Point'}
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
