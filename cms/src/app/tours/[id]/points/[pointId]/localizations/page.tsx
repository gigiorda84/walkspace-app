'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Save, Globe, Folder, X } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { MediaBrowserModal } from '@/components/media/MediaBrowserModal';
import { pointLocalizationsApi } from '@/lib/api/point-localizations';
import { pointsApi } from '@/lib/api/points';
import { toursApi } from '@/lib/api/tours';
import { versionsApi } from '@/lib/api/versions';
import { MediaFile } from '@/types/api';

interface LocalizationForm {
  title: string;
  description: string;
  audioFileId?: string;
  imageFileId?: string;
  subtitleFileId?: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  it: 'Italian',
  fr: 'French',
  en: 'English',
};

export default function PointLocalizationsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const tourId = params.id as string;
  const pointId = params.pointId as string;
  const versionId = searchParams.get('version');

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>(versionId || '');
  const [openModal, setOpenModal] = useState<'audio' | 'image' | 'subtitle' | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<{
    audio?: MediaFile;
    image?: MediaFile;
    subtitle?: MediaFile;
  }>({});

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<LocalizationForm>();

  // Fetch point details
  const { data: point } = useQuery({
    queryKey: ['tour-point', tourId, pointId],
    queryFn: () => pointsApi.getPoint(tourId, pointId),
  });

  // Fetch versions
  const { data: versions = [] } = useQuery({
    queryKey: ['tour-versions', tourId],
    queryFn: () => versionsApi.getVersionsByTour(tourId),
  });

  // Fetch localizations for this point
  const { data: localizations = [] } = useQuery({
    queryKey: ['point-localizations', tourId, pointId],
    queryFn: () => pointLocalizationsApi.getLocalizationsByPoint(tourId, pointId),
  });

  // Find current localization for selected version
  const currentLocalization = localizations.find(
    (loc) => loc.tourVersionId === selectedVersion
  );

  // Get the version object
  const currentVersion = versions.find((v) => v.id === selectedVersion);

  // Reset form when localization changes
  useEffect(() => {
    if (currentLocalization) {
      reset({
        title: currentLocalization.title || '',
        description: currentLocalization.description || '',
        audioFileId: currentLocalization.audioFileId || '',
        imageFileId: currentLocalization.imageFileId || '',
        subtitleFileId: currentLocalization.subtitleFileId || '',
      });
    } else {
      reset({
        title: '',
        description: '',
        audioFileId: '',
        imageFileId: '',
        subtitleFileId: '',
      });
    }
  }, [currentLocalization, reset]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: LocalizationForm) => {
      if (!selectedVersion || !currentVersion) {
        throw new Error('Please select a version');
      }

      // Clean up payload: convert empty strings to undefined for optional fields
      const cleanPayload = {
        title: data.title,
        description: data.description,
        audioFileId: data.audioFileId || undefined,
        imageFileId: data.imageFileId || undefined,
        subtitleFileId: data.subtitleFileId || undefined,
      };

      if (currentLocalization) {
        // Update existing
        return pointLocalizationsApi.updateLocalization(
          tourId,
          pointId,
          currentLocalization.id,
          cleanPayload
        );
      } else {
        // Create new - backend auto-links to version based on language
        return pointLocalizationsApi.createLocalization(tourId, pointId, {
          language: currentVersion.language,
          ...cleanPayload,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['point-localizations', tourId, pointId] });
      setError(null);
      setSuccessMessage('Localization saved successfully!');
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to save localization');
      setSuccessMessage(null);
    },
  });

  const handleFileSelect = (type: 'audio' | 'image' | 'subtitle', file: MediaFile) => {
    setSelectedFiles((prev) => ({ ...prev, [type]: file }));
    setValue(`${type}FileId`, file.id);
  };

  const handleClearFile = (type: 'audio' | 'image' | 'subtitle') => {
    setSelectedFiles((prev) => ({ ...prev, [type]: undefined }));
    setValue(`${type}FileId`, '');
  };

  const onSubmit = (data: LocalizationForm) => {
    saveMutation.mutate(data);
  };

  // Fetch tour details for breadcrumb
  const { data: tour } = useQuery({
    queryKey: ['tour', tourId],
    queryFn: () => toursApi.getTour(tourId),
  });

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="bg-white border-b border-gray-200 px-8 py-4 mb-6">
          <div className="flex items-center text-sm text-gray-900">
            <Link href="/tours" className="hover:text-indigo-600">
              Tours
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/tours/${tourId}`} className="hover:text-indigo-600">
              {tour?.slug || 'Tour'}
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/tours/${tourId}/points`} className="hover:text-indigo-600">
              Points
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Point {point?.sequenceOrder || ''} Localizations</span>
          </div>
        </div>
        <PageHeader
          title={`Point ${point?.sequenceOrder || ''} Localizations`}
          description={`Manage multilingual content for ${tour?.slug || 'this tour'}`}
        />

        <div className="p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700 font-medium">{successMessage}</p>
              </div>
            )}

            {/* Version Selector */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Globe size={20} className="mr-2" />
                Select Language Version
              </h2>

              {versions.length === 0 ? (
                <p className="text-sm text-gray-900">
                  No versions available. Create tour versions first.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {versions.map((version) => {
                    const hasLocalization = localizations.some(
                      (loc) => loc.tourVersionId === version.id
                    );
                    return (
                      <button
                        key={version.id}
                        onClick={() => setSelectedVersion(version.id)}
                        className={`p-4 border-2 rounded-lg text-left transition-colors ${
                          selectedVersion === version.id
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {LANGUAGE_LABELS[version.language]}
                          </span>
                          {hasLocalization && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Configured
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 truncate">{version.title}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Localization Form */}
            {selectedVersion && currentVersion && (
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  {LANGUAGE_LABELS[currentVersion.language]} Content
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      {...register('title', { required: 'Title is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-900 text-gray-900"
                      placeholder="Point title"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-900 text-gray-900"
                      placeholder="Point description or narration text"
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Audio File
                    </label>
                    <input type="hidden" {...register('audioFileId')} />
                    {selectedFiles.audio ? (
                      <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50">
                        <span className="text-sm text-gray-900 truncate">
                          {selectedFiles.audio.originalFilename || selectedFiles.audio.filename}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleClearFile('audio')}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setOpenModal('audio')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-900 bg-white hover:bg-gray-50"
                      >
                        <Folder size={18} className="mr-2" />
                        Browse Audio Files
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Image File
                    </label>
                    <input type="hidden" {...register('imageFileId')} />
                    {selectedFiles.image ? (
                      <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50">
                        <span className="text-sm text-gray-900 truncate">
                          {selectedFiles.image.originalFilename || selectedFiles.image.filename}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleClearFile('image')}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setOpenModal('image')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-900 bg-white hover:bg-gray-50"
                      >
                        <Folder size={18} className="mr-2" />
                        Browse Image Files
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Subtitle File
                    </label>
                    <input type="hidden" {...register('subtitleFileId')} />
                    {selectedFiles.subtitle ? (
                      <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50">
                        <span className="text-sm text-gray-900 truncate">
                          {selectedFiles.subtitle.originalFilename || selectedFiles.subtitle.filename}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleClearFile('subtitle')}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setOpenModal('subtitle')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-900 bg-white hover:bg-gray-50"
                      >
                        <Folder size={18} className="mr-2" />
                        Browse Subtitle Files
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={saveMutation.isPending}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Save size={20} />
                      <span>
                        {saveMutation.isPending
                          ? 'Saving...'
                          : currentLocalization
                          ? 'Update'
                          : 'Create'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Media Browser Modals */}
        <MediaBrowserModal
          isOpen={openModal === 'audio'}
          onClose={() => setOpenModal(null)}
          onSelect={(file) => handleFileSelect('audio', file)}
          fileType="audio"
          title="Select Audio File"
        />

        <MediaBrowserModal
          isOpen={openModal === 'image'}
          onClose={() => setOpenModal(null)}
          onSelect={(file) => handleFileSelect('image', file)}
          fileType="image"
          title="Select Image File"
        />

        <MediaBrowserModal
          isOpen={openModal === 'subtitle'}
          onClose={() => setOpenModal(null)}
          onSelect={(file) => handleFileSelect('subtitle', file)}
          fileType="subtitle"
          title="Select Subtitle File"
        />
      </MainLayout>
    </ProtectedRoute>
  );
}
