'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Save, Map as MapIcon } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { MapEditor } from '@/components/map/MapEditor';
import { versionsApi } from '@/lib/api/versions';
import { toursApi } from '@/lib/api/tours';

interface EditVersionForm {
  title: string;
  description: string;
  completionMessage?: string;
  status: 'draft' | 'published';
}

const LANGUAGE_LABELS: Record<string, string> = {
  it: 'Italian',
  fr: 'French',
  en: 'English',
};

export default function EditVersionPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tourId = params.id as string;
  const versionId = params.versionId as string;

  const [error, setError] = useState<string | null>(null);
  const [routePolyline, setRoutePolyline] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<EditVersionForm>();

  // Fetch tour details
  const { data: tour } = useQuery({
    queryKey: ['tour', tourId],
    queryFn: () => toursApi.getTour(tourId),
  });

  // Fetch version details
  const { data: version, isLoading } = useQuery({
    queryKey: ['tour-version', tourId, versionId],
    queryFn: () => versionsApi.getVersion(tourId, versionId),
  });

  // Initialize form when version data loads
  useEffect(() => {
    if (version) {
      reset({
        title: version.title,
        description: version.description,
        completionMessage: version.completionMessage || '',
        status: version.status,
      });
    }
  }, [version, reset]);

  // Load route from tour (routes are language-independent)
  useEffect(() => {
    if (tour?.routePolyline) {
      setRoutePolyline(tour.routePolyline);
    }
  }, [tour]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: EditVersionForm) => {
      return versionsApi.updateVersion(tourId, versionId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-version', tourId, versionId] });
      queryClient.invalidateQueries({ queryKey: ['tour-versions', tourId] });
      router.push(`/tours/${tourId}/versions`);
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to update version');
    },
  });

  const onSubmit = (data: EditVersionForm) => {
    setError(null);
    updateMutation.mutate(data);
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <PageHeader
          title={`Edit Version - ${version ? LANGUAGE_LABELS[version.language] : 'Loading...'}`}
          description={`${tour?.slug || 'Tour'} / ${version?.title || ''}`}
        />

        <div className="p-8">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-900">Loading version...</p>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Form Section */}
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Version Details</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Language
                    </label>
                    <input
                      type="text"
                      value={version ? LANGUAGE_LABELS[version.language] : ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
                    />
                    <p className="mt-1 text-xs text-gray-900">Language cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      {...register('title', { required: 'Title is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Description *
                    </label>
                    <textarea
                      {...register('description', { required: 'Description is required' })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Closing Message (optional)
                    </label>
                    <textarea
                      {...register('completionMessage')}
                      rows={3}
                      placeholder="Message shown to users when they complete the tour (e.g., thank you message, social media CTA, donation request)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      This message appears on the completion screen in the mobile app
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Status
                    </label>
                    <select
                      {...register('status')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Save size={20} />
                      <span>{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Route Display Section */}
              <div className="bg-white shadow-sm rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Tour Route</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {routePolyline ? `Route is set (${routePolyline.split(';').length} points)` : 'No route defined yet'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Routes are shared across all language versions. Edit in the <a href={`/tours/${tourId}/edit`} className="text-indigo-600 hover:text-indigo-700 underline">unified editor</a>.
                    </p>
                  </div>
                  {routePolyline && (
                    <button
                      type="button"
                      onClick={() => setShowMap(!showMap)}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      <MapIcon size={20} />
                      <span>{showMap ? 'Hide Map' : 'View Map'}</span>
                    </button>
                  )}
                </div>

                {showMap && routePolyline && (
                  <div className="h-[600px] relative border border-gray-200 rounded-lg overflow-hidden">
                    <MapEditor
                      points={[]}
                      onPointsChange={() => {}}
                      routePolyline={routePolyline}
                      onRouteChange={() => {}}
                      editable={false}
                      isDrawingRoute={false}
                    />

                    {/* Info overlay */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 text-xs z-10">
                      <p className="text-gray-600">Read-only view</p>
                      <p className="mt-1"><strong>Points:</strong> {routePolyline.split(';').length}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
