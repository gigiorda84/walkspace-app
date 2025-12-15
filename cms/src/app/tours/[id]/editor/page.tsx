'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Save, Folder, X, CheckCircle, Circle } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { MediaBrowserModal } from '@/components/media/MediaBrowserModal';
import { toursApi } from '@/lib/api/tours';
import { pointsApi } from '@/lib/api/points';
import { versionsApi } from '@/lib/api/versions';
import { pointLocalizationsApi } from '@/lib/api/point-localizations';
import { MediaFile, TourPoint, TourPointLocalization } from '@/types/api';

const LANGUAGE_LABELS: Record<string, string> = {
  it: 'Italian',
  fr: 'French',
  en: 'English',
};

interface PointEditorData {
  point: TourPoint;
  localization?: TourPointLocalization;
  title: string;
  description: string;
  audioFileId: string;
  imageFileId: string;
  subtitleFileId: string;
  audioFile?: MediaFile;
  imageFile?: MediaFile;
  subtitleFile?: MediaFile;
}

export default function TourEditorPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const tourId = params.id as string;

  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [expandedPoints, setExpandedPoints] = useState<Set<string>>(new Set());
  const [editingData, setEditingData] = useState<Record<string, PointEditorData>>({});
  const [mediaModalOpen, setMediaModalOpen] = useState<{
    pointId: string;
    type: 'audio' | 'image' | 'subtitle';
  } | null>(null);

  // Fetch tour
  const { data: tour } = useQuery({
    queryKey: ['tour', tourId],
    queryFn: () => toursApi.getTour(tourId),
  });

  // Fetch versions
  const { data: versions = [] } = useQuery({
    queryKey: ['tour-versions', tourId],
    queryFn: () => versionsApi.getVersionsByTour(tourId),
  });

  // Fetch points
  const { data: points = [] } = useQuery({
    queryKey: ['tour-points', tourId],
    queryFn: () => pointsApi.getPointsByTour(tourId),
  });

  // Fetch all localizations for selected language
  const { data: allLocalizations = [] } = useQuery({
    queryKey: ['all-localizations', tourId, selectedLanguage],
    queryFn: async () => {
      if (!selectedLanguage || points.length === 0) return [];
      const results = await Promise.all(
        points.map((point) =>
          pointLocalizationsApi.getLocalizationsByPoint(tourId, point.id)
        )
      );
      return results.flat();
    },
    enabled: !!selectedLanguage && points.length > 0,
  });

  // Initialize editing data when points or localizations change
  useEffect(() => {
    if (points.length === 0 || !selectedLanguage) return;

    const newData: Record<string, PointEditorData> = {};
    points.forEach((point) => {
      const localization = allLocalizations.find(
        (loc) =>
          loc.tourPointId === point.id &&
          loc.language === selectedLanguage
      );

      newData[point.id] = {
        point,
        localization,
        title: localization?.title || '',
        description: localization?.description || '',
        audioFileId: localization?.audioFileId || '',
        imageFileId: localization?.imageFileId || '',
        subtitleFileId: localization?.subtitleFileId || '',
      };
    });

    setEditingData(newData);
  }, [points, allLocalizations, selectedLanguage]);

  // Set default language
  useEffect(() => {
    if (versions.length > 0 && !selectedLanguage) {
      setSelectedLanguage(versions[0].language);
    }
  }, [versions, selectedLanguage]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (pointId: string) => {
      const data = editingData[pointId];
      if (!data) return;

      const selectedVersion = versions.find((v) => v.language === selectedLanguage);
      if (!selectedVersion) throw new Error('Version not found');

      const payload = {
        tourVersionId: selectedVersion.id,
        language: selectedLanguage,
        title: data.title,
        description: data.description,
        audioFileId: data.audioFileId || undefined,
        imageFileId: data.imageFileId || undefined,
        subtitleFileId: data.subtitleFileId || undefined,
      };

      if (data.localization) {
        return pointLocalizationsApi.updateLocalization(
          tourId,
          pointId,
          data.localization.id,
          payload
        );
      } else {
        return pointLocalizationsApi.createLocalization(tourId, pointId, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-localizations', tourId, selectedLanguage] });
    },
  });

  const togglePoint = (pointId: string) => {
    setExpandedPoints((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pointId)) {
        newSet.delete(pointId);
      } else {
        newSet.add(pointId);
      }
      return newSet;
    });
  };

  const updatePointData = (pointId: string, field: keyof PointEditorData, value: any) => {
    setEditingData((prev) => ({
      ...prev,
      [pointId]: {
        ...prev[pointId],
        [field]: value,
      },
    }));
  };

  const handleFileSelect = (pointId: string, type: 'audio' | 'image' | 'subtitle', file: MediaFile) => {
    updatePointData(pointId, `${type}FileId`, file.id);
    updatePointData(pointId, `${type}File`, file);
    setMediaModalOpen(null);
  };

  const clearFile = (pointId: string, type: 'audio' | 'image' | 'subtitle') => {
    updatePointData(pointId, `${type}FileId`, '');
    updatePointData(pointId, `${type}File`, undefined);
  };

  const isPointComplete = (pointId: string) => {
    const data = editingData[pointId];
    return data && data.title && data.audioFileId;
  };

  if (versions.length === 0) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <PageHeader
            title="Tour Editor"
            description={`Content editor for ${tour?.slug || 'tour'}`}
          />
          <div className="p-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800 mb-4">
                No language versions found. Create a tour version first.
              </p>
              <Link
                href={`/tours/${tourId}/versions/new`}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create Version
              </Link>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (points.length === 0) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <PageHeader
            title="Tour Editor"
            description={`Content editor for ${tour?.slug || 'tour'}`}
          />
          <div className="p-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800 mb-4">
                No points found. Add tour points first.
              </p>
              <Link
                href={`/tours/${tourId}/points/new`}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Add Point
              </Link>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="bg-white border-b border-gray-200 px-8 py-4 mb-6">
          <div className="flex items-center text-sm text-gray-500">
            <Link href="/tours" className="hover:text-gray-700">
              Tours
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/tours/${tourId}`} className="hover:text-gray-700">
              {tour?.slug || 'Tour'}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Content Editor</span>
          </div>
        </div>

        <PageHeader
          title="Tour Content Editor"
          description={`Edit point content for ${tour?.slug || 'tour'}`}
        />

        <div className="p-8">
          {/* Language Selector */}
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Select Language</h2>
            <div className="flex gap-3">
              {versions.map((version) => (
                <button
                  key={version.id}
                  onClick={() => setSelectedLanguage(version.language)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    selectedLanguage === version.language
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {LANGUAGE_LABELS[version.language]}
                </button>
              ))}
            </div>
          </div>

          {/* Points Editor */}
          <div className="space-y-4">
            {points.map((point) => {
              const isExpanded = expandedPoints.has(point.id);
              const data = editingData[point.id];
              const isComplete = isPointComplete(point.id);

              return (
                <div key={point.id} className="bg-white shadow-sm rounded-lg overflow-hidden">
                  {/* Point Header */}
                  <button
                    onClick={() => togglePoint(point.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                        {point.sequenceOrder}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center space-x-2">
                          {isComplete ? (
                            <CheckCircle size={20} className="text-green-500" />
                          ) : (
                            <Circle size={20} className="text-gray-300" />
                          )}
                          <h3 className="text-lg font-medium text-gray-900">
                            {data?.title || `Point ${point.sequenceOrder}`}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-500">
                          {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {saveMutation.isPending && saveMutation.variables === point.id && (
                        <span className="text-sm text-gray-500">Saving...</span>
                      )}
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>

                  {/* Point Content */}
                  {isExpanded && data && (
                    <div className="px-6 py-4 border-t border-gray-200 space-y-4">
                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={data.title}
                          onChange={(e) => updatePointData(point.id, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Enter point title"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description (optional)
                        </label>
                        <textarea
                          value={data.description}
                          onChange={(e) => updatePointData(point.id, 'description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Enter point description"
                        />
                      </div>

                      {/* Audio File */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Audio Track *
                        </label>
                        {data.audioFileId ? (
                          <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50">
                            <span className="text-sm text-gray-900">Audio file selected</span>
                            <button
                              onClick={() => clearFile(point.id, 'audio')}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setMediaModalOpen({ pointId: point.id, type: 'audio' })}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <Folder size={18} className="mr-2" />
                            Browse Audio Files
                          </button>
                        )}
                      </div>

                      {/* Subtitles */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subtitles
                        </label>
                        {data.subtitleFileId ? (
                          <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50">
                            <span className="text-sm text-gray-900">Subtitle file selected</span>
                            <button
                              onClick={() => clearFile(point.id, 'subtitle')}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setMediaModalOpen({ pointId: point.id, type: 'subtitle' })}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <Folder size={18} className="mr-2" />
                            Browse Subtitle Files
                          </button>
                        )}
                      </div>

                      {/* Photo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Photo (optional)
                        </label>
                        {data.imageFileId ? (
                          <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50">
                            <span className="text-sm text-gray-900">Image file selected</span>
                            <button
                              onClick={() => clearFile(point.id, 'image')}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setMediaModalOpen({ pointId: point.id, type: 'image' })}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <Folder size={18} className="mr-2" />
                            Browse Image Files
                          </button>
                        )}
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4 border-t">
                        <button
                          onClick={() => saveMutation.mutate(point.id)}
                          disabled={!data.title || saveMutation.isPending}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <Save size={18} />
                          <span>{saveMutation.isPending ? 'Saving...' : 'Save Point'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Media Browser Modals */}
        {mediaModalOpen && (
          <>
            <MediaBrowserModal
              isOpen={mediaModalOpen.type === 'audio'}
              onClose={() => setMediaModalOpen(null)}
              onSelect={(file) => handleFileSelect(mediaModalOpen.pointId, 'audio', file)}
              fileType="audio"
              title="Select Audio File"
            />
            <MediaBrowserModal
              isOpen={mediaModalOpen.type === 'image'}
              onClose={() => setMediaModalOpen(null)}
              onSelect={(file) => handleFileSelect(mediaModalOpen.pointId, 'image', file)}
              fileType="image"
              title="Select Image File"
            />
            <MediaBrowserModal
              isOpen={mediaModalOpen.type === 'subtitle'}
              onClose={() => setMediaModalOpen(null)}
              onSelect={(file) => handleFileSelect(mediaModalOpen.pointId, 'subtitle', file)}
              fileType="subtitle"
              title="Select Subtitle File"
            />
          </>
        )}
      </MainLayout>
    </ProtectedRoute>
  );
}
