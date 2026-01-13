'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Save, Folder, X, CheckCircle, Circle, Map as MapIcon } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { MediaBrowserModal } from '@/components/media/MediaBrowserModal';
import { MapEditor } from '@/components/map/MapEditor';
import { RouteDrawer } from '@/components/map/RouteDrawer';
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
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [routePolyline, setRoutePolyline] = useState<string | null>(null);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);

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

  // Load route from tour (once when tour loads)
  useEffect(() => {
    if (tour?.routePolyline) {
      setRoutePolyline(tour.routePolyline);
    }
  }, [tour]);

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
        language: selectedLanguage,
        title: data.title || 'Untitled',
        description: data.description || ' ',
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

  const saveRouteMutation = useMutation({
    mutationFn: async () => {
      if (!tour) throw new Error('Tour not found');

      return toursApi.updateTour(tourId, {
        routePolyline: routePolyline || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour', tourId] });
      alert('Route saved successfully!');
    },
    onError: (error) => {
      console.error('Failed to save route:', error);
      alert('Failed to save route. Please try again.');
    },
  });

  const handleSaveRoute = () => {
    if (!routePolyline || routePolyline.split(';').length < 2) {
      alert('Route must have at least 2 points');
      return;
    }
    saveRouteMutation.mutate();
  };

  const handleClearRoute = () => {
    if (confirm('Are you sure you want to clear the route? This will remove all route points.')) {
      setRoutePolyline(null);
      setIsDrawingRoute(false);
    }
  };

  const handleStartDrawing = () => {
    if (!showRouteMap) {
      setShowRouteMap(true);
    }
    setIsDrawingRoute(true);
  };

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
          <div className="flex items-center text-sm text-gray-900">
            <Link href="/tours" className="hover:text-gray-900">
              Tours
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/tours/${tourId}`} className="hover:text-gray-900">
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
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {LANGUAGE_LABELS[version.language]}
                </button>
              ))}
            </div>
          </div>

          {/* Route Map Section */}
          {selectedLanguage && (
            <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Tour Route</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {routePolyline
                      ? `Route configured with ${routePolyline.split(';').length} points`
                      : 'Draw a walking path for this tour'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {!isDrawingRoute && (
                    <button
                      onClick={handleStartDrawing}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                    >
                      <MapIcon size={16} />
                      <span>{routePolyline ? 'Edit Route' : 'Draw Route'}</span>
                    </button>
                  )}
                  {routePolyline && !isDrawingRoute && (
                    <button
                      onClick={handleClearRoute}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                    >
                      <X size={16} />
                      <span>Clear</span>
                    </button>
                  )}
                  {routePolyline && (
                    <button
                      onClick={handleSaveRoute}
                      disabled={saveRouteMutation.isPending || isDrawingRoute}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                    >
                      <Save size={16} />
                      <span>{saveRouteMutation.isPending ? 'Saving...' : 'Save Route'}</span>
                    </button>
                  )}
                  {showRouteMap && (
                    <button
                      onClick={() => setShowRouteMap(false)}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                    >
                      <X size={16} />
                      <span>Hide Map</span>
                    </button>
                  )}
                </div>
              </div>

              {showRouteMap && (
                <div className="h-[600px] relative border border-gray-200 rounded-lg overflow-hidden">
                  <MapEditor
                    points={points.map((p) => ({
                      id: p.id,
                      latitude: p.latitude,
                      longitude: p.longitude,
                      sequenceOrder: p.sequenceOrder,
                      triggerRadiusMeters: p.triggerRadiusMeters,
                    }))}
                    onPointsChange={() => {}}
                    routePolyline={routePolyline}
                    onRouteChange={setRoutePolyline}
                    editable={true}
                    isDrawingRoute={isDrawingRoute}
                  />

                  <RouteDrawer
                    onRouteComplete={setRoutePolyline}
                    initialRoute={routePolyline}
                    onDrawingStateChange={setIsDrawingRoute}
                  />

                  {/* Info overlay */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 text-sm z-10 max-w-md">
                    {isDrawingRoute ? (
                      <div className="space-y-2">
                        <p className="font-semibold text-indigo-600">🎨 Drawing Mode Active</p>
                        <ul className="text-xs text-gray-700 space-y-1">
                          <li>• Click on the map to add points to your route</li>
                          <li>• The blue line shows your walking path</li>
                          <li>• Click "Done" on the drawing controls when finished</li>
                          <li>• Click "Clear" to start over</li>
                        </ul>
                        {routePolyline && (
                          <p className="text-xs text-gray-600 pt-2 border-t">
                            Current: <strong>{routePolyline.split(';').length} points</strong>
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p><strong>Route Status:</strong> {routePolyline ? '✓ Configured' : 'Not set'}</p>
                        {routePolyline && (
                          <p className="mt-1 text-indigo-600">
                            <strong>Points:</strong> {routePolyline.split(';').length}
                          </p>
                        )}
                        {!routePolyline && (
                          <p className="mt-2 text-xs text-gray-600">
                            Click "Draw Route" above to start creating the walking path
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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
                        <p className="text-sm text-gray-900">
                          {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {saveMutation.isPending && saveMutation.variables === point.id && (
                        <span className="text-sm text-gray-900">Saving...</span>
                      )}
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>

                  {/* Point Content */}
                  {isExpanded && data && (
                    <div className="px-6 py-4 border-t border-gray-200 space-y-4">
                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
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
                        <label className="block text-sm font-medium text-gray-900 mb-2">
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
                        <label className="block text-sm font-medium text-gray-900 mb-2">
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
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-900 bg-white hover:bg-gray-50"
                          >
                            <Folder size={18} className="mr-2" />
                            Browse Audio Files
                          </button>
                        )}
                      </div>

                      {/* Subtitles */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
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
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-900 bg-white hover:bg-gray-50"
                          >
                            <Folder size={18} className="mr-2" />
                            Browse Subtitle Files
                          </button>
                        )}
                      </div>

                      {/* Photo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
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
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-900 bg-white hover:bg-gray-50"
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
