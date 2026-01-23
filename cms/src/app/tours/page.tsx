'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Copy, MapPin } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toursApi } from '@/lib/api/tours';
import { Tour } from '@/types/api';

export default function ToursPage() {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<Tour | null>(null);

  const { data: tours, isLoading, error } = useQuery({
    queryKey: ['tours'],
    queryFn: toursApi.getAllTours,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => toursApi.deleteTour(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      setDeleteDialogOpen(false);
      setTourToDelete(null);
    },
  });

  const cloneMutation = useMutation({
    mutationFn: async (tour: Tour) => {
      const clonedData = {
        slug: `${tour.slug}-copy`,
        defaultCity: tour.defaultCity,
        defaultDurationMinutes: tour.defaultDurationMinutes,
        defaultDistanceKm: tour.defaultDistanceKm,
        defaultDifficulty: tour.defaultDifficulty,
        isProtected: tour.isProtected,
      };
      return toursApi.createTour(clonedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours'] });
    },
  });

  const handleDeleteClick = (tour: Tour) => {
    setTourToDelete(tour);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (tourToDelete) {
      deleteMutation.mutate(tourToDelete.id);
    }
  };

  const handleCloneClick = (tour: Tour) => {
    cloneMutation.mutate(tour);
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <PageHeader
          title="Tours"
          description="Manage sonic walking tours"
          actions={
            <Link
              href="/tours/new"
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
            >
              <Plus size={18} />
              <span>New Tour</span>
            </Link>
          }
        />

        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">Failed to load tours. Please try again.</p>
            </div>
          )}

          {tours && tours.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="mx-auto h-12 w-12 text-gray-900" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tours</h3>
              <p className="mt-1 text-sm text-gray-900">Get started by creating a new tour.</p>
              <div className="mt-6">
                <Link
                  href="/tours/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  New Tour
                </Link>
              </div>
            </div>
          )}

          {tours && tours.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Tour
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Distance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Languages
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tours.map((tour) => (
                    <tr key={tour.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{tour.slug}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tour.defaultCity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tour.defaultDurationMinutes} min</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tour.defaultDistanceKm} km</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tour.publishedVersionsCount && tour.publishedVersionsCount > 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {tour.publishedVersionsCount && tour.publishedVersionsCount > 0 ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1">
                          {tour.languages && tour.languages.length > 0 ? (
                            tour.languages.map((lang) => (
                              <span
                                key={lang}
                                className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"
                              >
                                {lang.toUpperCase()}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {tour.pointsCount !== undefined ? tour.pointsCount : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/tours/${tour.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => handleCloneClick(tour)}
                            disabled={cloneMutation.isPending}
                            className="text-gray-900 hover:text-gray-900 disabled:opacity-50"
                            title="Duplicate"
                          >
                            <Copy size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(tour)}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <ConfirmDialog
          isOpen={deleteDialogOpen}
          title="Delete Tour"
          message={`Are you sure you want to delete "${tourToDelete?.slug}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setDeleteDialogOpen(false);
            setTourToDelete(null);
          }}
          isLoading={deleteMutation.isPending}
        />
      </MainLayout>
    </ProtectedRoute>
  );
}
