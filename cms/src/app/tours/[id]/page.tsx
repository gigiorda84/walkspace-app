'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, Plus, MapPin, FileEdit } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { toursApi } from '@/lib/api/tours';

export default function TourDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: tour, isLoading: tourLoading } = useQuery({
    queryKey: ['tour', id],
    queryFn: () => toursApi.getTour(id),
  });

  const { data: versions, isLoading: versionsLoading } = useQuery({
    queryKey: ['tour-versions', id],
    queryFn: () => toursApi.getTourVersions(id),
  });

  const { data: points, isLoading: pointsLoading } = useQuery({
    queryKey: ['tour-points', id],
    queryFn: () => toursApi.getTourPoints(id),
  });

  const isLoading = tourLoading || versionsLoading || pointsLoading;

  return (
    <ProtectedRoute>
      <MainLayout>
        <PageHeader
          title={tour?.slug || 'Tour Details'}
          description={tour?.defaultCity || ''}
          actions={
            <div className="flex items-center space-x-3">
              <Link
                href="/tours"
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
              >
                <ArrowLeft size={18} />
                <span>Back</span>
              </Link>
              <Link
                href={`/tours/${id}/edit`}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
              >
                <Edit size={18} />
                <span>Edit</span>
              </Link>
            </div>
          }
        />

        <div className="p-6 space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {!isLoading && tour && (
            <>
              {/* Content Editor CTA */}
              {versions && versions.length > 0 && points && points.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-white">
                      <h3 className="text-lg font-semibold mb-1">Edit Tour Content</h3>
                      <p className="text-indigo-100 text-sm">
                        Add titles, descriptions, audio tracks, and photos to your tour points
                      </p>
                    </div>
                    <Link
                      href={`/tours/${id}/edit`}
                      className="flex items-center space-x-2 px-6 py-3 bg-white text-indigo-600 rounded-md hover:bg-indigo-50 font-medium shadow-md transition-colors"
                    >
                      <FileEdit size={20} />
                      <span>Open Editor</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Tour Info */}
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    Tour Information
                  </h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-900">Slug</dt>
                      <dd className="mt-1 text-sm text-gray-900">{tour.slug}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-900">City</dt>
                      <dd className="mt-1 text-sm text-gray-900">{tour.defaultCity}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-900">Duration</dt>
                      <dd className="mt-1 text-sm text-gray-900">{tour.defaultDurationMinutes} minutes</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-900">Distance</dt>
                      <dd className="mt-1 text-sm text-gray-900">{tour.defaultDistanceKm} km</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-900">Status</dt>
                      <dd className="mt-1">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tour.isProtected
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {tour.isProtected ? 'Protected' : 'Public'}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Language Versions */}
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Language Versions ({versions?.length || 0})
                    </h3>
                    <Link
                      href={`/tours/${id}/versions/new`}
                      className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                    >
                      <Plus size={16} />
                      <span>Add Version</span>
                    </Link>
                  </div>

                  {versions && versions.length > 0 ? (
                    <div className="space-y-3">
                      {versions.map((version) => (
                        <div
                          key={version.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-indigo-500"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                {version.title} ({version.language.toUpperCase()})
                              </h4>
                              <p className="mt-1 text-sm text-gray-900">{version.description}</p>
                              <span
                                className={`mt-2 inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                                  version.status === 'published'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {version.status}
                              </span>
                            </div>
                            <Link
                              href={`/tours/${id}/versions/${version.id}/edit`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit size={18} />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900">No language versions yet.</p>
                  )}
                </div>
              </div>

              {/* Tour Points */}
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Tour Points ({points?.length || 0})
                    </h3>
                    <Link
                      href={`/tours/${id}/edit`}
                      className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                    >
                      <Edit size={16} />
                      <span>Edit in Unified Editor</span>
                    </Link>
                  </div>

                  {points && points.length > 0 ? (
                    <div className="space-y-2">
                      {points.map((point, index) => (
                        <div
                          key={point.id}
                          className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                                {point.sequenceOrder}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                <MapPin className="inline w-4 h-4 mr-1" />
                                {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                              </p>
                              <p className="text-xs text-gray-900">
                                Radius: {point.triggerRadiusMeters}m
                              </p>
                            </div>
                          </div>
                          <Link
                            href={`/tours/${id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit size={18} />
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900">No tour points yet.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
