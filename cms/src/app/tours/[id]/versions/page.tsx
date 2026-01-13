'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Globe, CheckCircle, XCircle } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { versionsApi } from '@/lib/api/versions';
import { toursApi } from '@/lib/api/tours';
import { TourVersion } from '@/types/api';

const LANGUAGE_LABELS: Record<string, string> = {
  it: 'Italian',
  fr: 'French',
  en: 'English',
};

export default function TourVersionsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tourId = params.id as string;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<TourVersion | null>(null);

  // Fetch tour details
  const { data: tour, isLoading: isTourLoading } = useQuery({
    queryKey: ['tour', tourId],
    queryFn: () => toursApi.getTour(tourId),
  });

  // Fetch versions
  const { data: versions = [], isLoading: isVersionsLoading } = useQuery({
    queryKey: ['tour-versions', tourId],
    queryFn: () => versionsApi.getVersionsByTour(tourId),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (versionId: string) => versionsApi.deleteVersion(tourId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-versions', tourId] });
      setDeleteDialogOpen(false);
      setVersionToDelete(null);
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: ({ versionId, publish }: { versionId: string; publish: boolean }) => {
      return publish
        ? versionsApi.publishVersion(tourId, versionId)
        : versionsApi.unpublishVersion(tourId, versionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-versions', tourId] });
    },
  });

  const handleDelete = (version: TourVersion) => {
    setVersionToDelete(version);
    setDeleteDialogOpen(true);
  };

  const handleTogglePublish = (version: TourVersion) => {
    const publish = version.status !== 'published';
    publishMutation.mutate({ versionId: version.id, publish });
  };

  const isLoading = isTourLoading || isVersionsLoading;

  return (
    <ProtectedRoute>
      <MainLayout>
        <PageHeader
          title={`Language Versions - ${tour?.slug || 'Tour'}`}
          description="Manage multilingual tour versions"
          actions={
            <Link
              href={`/tours/${tourId}/versions/new`}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus size={20} />
              <span>New Version</span>
            </Link>
          }
        />

        <div className="p-8">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-900">Loading versions...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Globe size={48} className="mx-auto text-gray-900 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No versions yet</h3>
              <p className="text-gray-900 mb-4">Create your first language version to get started.</p>
              <Link
                href={`/tours/${tourId}/versions/new`}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <Plus size={20} />
                <span>Create Version</span>
              </Link>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Language
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {versions.map((version) => (
                    <tr key={version.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Globe size={16} className="text-gray-900 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {LANGUAGE_LABELS[version.language] || version.language}
                          </span>
                          <span className="ml-2 text-xs text-gray-900">({version.language})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{version.title}</div>
                        <div className="text-sm text-gray-900 truncate max-w-md">
                          {version.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            version.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {version.status === 'published' ? (
                            <CheckCircle size={12} className="mr-1" />
                          ) : (
                            <XCircle size={12} className="mr-1" />
                          )}
                          {version.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tour?.routePolyline ? (
                          <span className="text-green-600" title="Route is shared across all languages">✓ Shared</span>
                        ) : (
                          <span className="text-gray-400">Not set</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        <Link
                          href={`/tours/${tourId}/versions/${version.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                        >
                          <Edit2 size={16} className="mr-1" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleTogglePublish(version)}
                          disabled={publishMutation.isPending}
                          className={`inline-flex items-center ${
                            version.status === 'published'
                              ? 'text-yellow-600 hover:text-yellow-900'
                              : 'text-green-600 hover:text-green-900'
                          } disabled:opacity-50`}
                        >
                          {version.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleDelete(version)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                        >
                          <Trash2 size={16} className="mr-1" />
                          Delete
                        </button>
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
          onCancel={() => setDeleteDialogOpen(false)}
          onConfirm={() => {
            if (versionToDelete) {
              deleteMutation.mutate(versionToDelete.id);
            }
          }}
          title="Delete Version"
          message={`Are you sure you want to delete the ${
            versionToDelete ? LANGUAGE_LABELS[versionToDelete.language] : ''
          } version? This action cannot be undone.`}
          confirmLabel="Delete"
          isLoading={deleteMutation.isPending}
        />
      </MainLayout>
    </ProtectedRoute>
  );
}
