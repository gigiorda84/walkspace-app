'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, MapPin, Edit2, Trash2, Globe } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { pointsApi } from '@/lib/api/points';
import { pointLocalizationsApi } from '@/lib/api/point-localizations';
import { toursApi } from '@/lib/api/tours';
import { versionsApi } from '@/lib/api/versions';
import { TourPoint } from '@/types/api';

const LANGUAGE_LABELS: Record<string, string> = {
  it: 'Italian',
  fr: 'French',
  en: 'English',
};

export default function TourPointsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tourId = params.id as string;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pointToDelete, setPointToDelete] = useState<TourPoint | null>(null);

  // Fetch tour details
  const { data: tour, isLoading: isTourLoading } = useQuery({
    queryKey: ['tour', tourId],
    queryFn: () => toursApi.getTour(tourId),
  });

  // Fetch points
  const { data: points = [], isLoading: isPointsLoading } = useQuery({
    queryKey: ['tour-points', tourId],
    queryFn: () => pointsApi.getPointsByTour(tourId),
  });

  // Fetch versions for localization context
  const { data: versions = [] } = useQuery({
    queryKey: ['tour-versions', tourId],
    queryFn: () => versionsApi.getVersionsByTour(tourId),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (pointId: string) => pointsApi.deletePoint(tourId, pointId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-points', tourId] });
      setDeleteDialogOpen(false);
      setPointToDelete(null);
    },
  });

  const handleDelete = (point: TourPoint) => {
    setPointToDelete(point);
    setDeleteDialogOpen(true);
  };

  const isLoading = isTourLoading || isPointsLoading;

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="bg-white border-b border-gray-200 px-8 py-4 mb-6">
          <div className="flex items-center text-sm text-gray-900">
            <Link href="/tours" className="hover:text-gray-900">
              Tours
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/tours/${tourId}`} className="hover:text-gray-900">
              {tour?.slug || 'Tour'}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Points</span>
          </div>
        </div>
        <PageHeader
          title="Tour Points"
          description={`Manage waypoints and content for ${tour?.slug || 'this tour'}`}
          actions={
            <Link
              href={`/tours/${tourId}/points/new`}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus size={20} />
              <span>Add Point</span>
            </Link>
          }
        />

        <div className="p-8">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-900">Loading points...</p>
            </div>
          ) : points.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <MapPin size={48} className="mx-auto text-gray-900 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No points yet</h3>
              <p className="text-gray-900 mb-4">Create your first tour point to get started.</p>
              <Link
                href={`/tours/${tourId}/points/new`}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <Plus size={20} />
                <span>Add Point</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {points.map((point) => (
                <div key={point.id} className="bg-white shadow-sm rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                        {point.sequenceOrder}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin size={16} className="text-gray-900" />
                          <p className="text-sm font-medium text-gray-900">
                            {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-900">
                          Trigger radius: {point.triggerRadiusMeters}m
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/tours/${tourId}/points/${point.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900 inline-flex items-center text-sm"
                      >
                        <Edit2 size={16} className="mr-1" />
                        Edit Point
                      </Link>
                      <button
                        onClick={() => handleDelete(point)}
                        className="text-red-600 hover:text-red-900 inline-flex items-center text-sm"
                      >
                        <Trash2 size={16} className="mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Localizations Section */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center">
                        <Globe size={16} className="mr-2" />
                        Localizations
                      </h4>
                      <Link
                        href={`/tours/${tourId}/points/${point.id}/localizations/new`}
                        className="text-sm text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                      >
                        <Plus size={14} className="mr-1" />
                        Add Localization
                      </Link>
                    </div>

                    {versions.length === 0 ? (
                      <p className="text-xs text-gray-900">
                        Create tour versions first to add localizations
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {versions.map((version) => (
                          <div
                            key={version.id}
                            className="border border-gray-200 rounded-md p-3 hover:border-indigo-500"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {LANGUAGE_LABELS[version.language]}
                              </span>
                              <Link
                                href={`/tours/${tourId}/points/${point.id}/localizations?version=${version.id}`}
                                className="text-xs text-indigo-600 hover:text-indigo-900"
                              >
                                Manage
                              </Link>
                            </div>
                            <p className="text-xs text-gray-900">
                              Configure audio, image, and text content
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <ConfirmDialog
          isOpen={deleteDialogOpen}
          onCancel={() => setDeleteDialogOpen(false)}
          onConfirm={() => {
            if (pointToDelete) {
              deleteMutation.mutate(pointToDelete.id);
            }
          }}
          title="Delete Point"
          message={`Are you sure you want to delete Point ${pointToDelete?.sequenceOrder}? This will also delete all localizations for this point. This action cannot be undone.`}
          confirmLabel="Delete"
          isLoading={deleteMutation.isPending}
        />
      </MainLayout>
    </ProtectedRoute>
  );
}
