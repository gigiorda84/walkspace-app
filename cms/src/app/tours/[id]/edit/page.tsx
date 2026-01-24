'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Folder, X, MapPin, Trash2, ArrowUp, ArrowDown, AlertTriangle, Map as MapIcon, Save } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { MapEditor } from '@/components/map/MapEditor';
import { RouteDrawer } from '@/components/map/RouteDrawer';
import { MediaBrowserModal } from '@/components/media/MediaBrowserModal';
import { MediaFilePreview } from '@/components/media/MediaFilePreview';
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

interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  sequenceOrder: number;
  triggerRadiusMeters: number;
}

interface PointContentData {
  title: string;
  description: string;
  audioFileId: string;
  imageFileId: string;
  subtitleFileId: string;
  localizationId?: string;
}

export default function UnifiedTourEditorPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const router = useRouter();
  const tourId = params.id as string;
  const pointRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Tour metadata state
  const [tourData, setTourData] = useState({
    slug: '',
    defaultCity: '',
    defaultDurationMinutes: 0,
    defaultDistanceKm: 0,
    defaultDifficulty: 'facile',
    isProtected: false,
  });

  // Version content state (title & description per language)
  const [versionContent, setVersionContent] = useState({
    title: '',
    description: '',
    completionMessage: '',
    busInfo: '',
    coverImageFileId: '',
    coverTrailerFileId: '',
    versionId: '',
  });

  // Version status state
  const [versionStatus, setVersionStatus] = useState<'draft' | 'published'>('draft');

  // New language modal state
  const [showAddLanguageModal, setShowAddLanguageModal] = useState(false);
  const [newLanguage, setNewLanguage] = useState('');

  // Map & points state
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  // Point content state (per language)
  const [pointContent, setPointContent] = useState<Record<string, PointContentData>>({});

  // Media browser state
  const [mediaModalOpen, setMediaModalOpen] = useState<{
    pointId: string;
    type: 'audio' | 'image' | 'subtitle';
  } | null>(null);
  const [tourCoverModalOpen, setTourCoverModalOpen] = useState(false);
  const [tourTrailerModalOpen, setTourTrailerModalOpen] = useState(false);

  // Route state
  const [routePolyline, setRoutePolyline] = useState<string | null>(null);
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);

  // Auto-save tracking
  const [savingTour, setSavingTour] = useState(false);
  const [lastSavedTour, setLastSavedTour] = useState('');

  // Fetch tour
  const { data: tour, isLoading: tourLoading } = useQuery({
    queryKey: ['tour', tourId],
    queryFn: () => toursApi.getTour(tourId),
  });

  // Fetch versions
  const { data: versions = [] } = useQuery({
    queryKey: ['tour-versions', tourId],
    queryFn: () => versionsApi.getVersionsByTour(tourId),
  });

  // Fetch points
  const { data: points = [], refetch: refetchPoints } = useQuery({
    queryKey: ['tour-points', tourId],
    queryFn: () => pointsApi.getPointsByTour(tourId),
  });

  // Fetch localizations for selected language
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

  // Initialize tour metadata
  useEffect(() => {
    if (tour) {
      setTourData({
        slug: tour.slug,
        defaultCity: tour.defaultCity,
        defaultDurationMinutes: tour.defaultDurationMinutes,
        defaultDistanceKm: tour.defaultDistanceKm,
        defaultDifficulty: tour.defaultDifficulty || 'facile',
        isProtected: tour.isProtected,
      });
      setLastSavedTour(JSON.stringify(tour));

      // Load route from tour
      if (tour.routePolyline) {
        setRoutePolyline(tour.routePolyline);
      }
    }
  }, [tour]);

  // Initialize map points from database
  useEffect(() => {
    if (points.length > 0) {
      const mappedPoints: MapPoint[] = points.map((p) => ({
        id: p.id,
        latitude: p.latitude,
        longitude: p.longitude,
        sequenceOrder: p.sequenceOrder,
        triggerRadiusMeters: p.triggerRadiusMeters,
      }));
      setMapPoints(mappedPoints);
    }
  }, [points]);

  // Initialize point content from localizations
  useEffect(() => {
    if (!selectedLanguage) return;

    console.log('Updating content for language:', selectedLanguage);
    console.log('Available localizations:', allLocalizations);

    const newContent: Record<string, PointContentData> = {};
    mapPoints.forEach((point) => {
      const loc = allLocalizations.find(
        (l) => l.tourPointId === point.id && l.language === selectedLanguage
      );

      newContent[point.id] = {
        title: loc?.title || '',
        description: loc?.description || '',
        audioFileId: loc?.audioFileId || '',
        imageFileId: loc?.imageFileId || '',
        subtitleFileId: loc?.subtitleFileId || '',
        localizationId: loc?.id,
      };
    });

    console.log('New content:', newContent);
    setPointContent(newContent);
  }, [mapPoints, allLocalizations, selectedLanguage]);

  // Set default language
  useEffect(() => {
    if (versions.length > 0 && !selectedLanguage) {
      setSelectedLanguage(versions[0].language);
    }
  }, [versions, selectedLanguage]);

  // Load version content when language changes
  useEffect(() => {
    if (!selectedLanguage) return;

    const version = versions.find(v => v.language === selectedLanguage);
    if (version) {
      setVersionContent({
        title: version.title || '',
        description: version.description || '',
        completionMessage: version.completionMessage || '',
        busInfo: version.busInfo || '',
        coverImageFileId: version.coverImageFileId || '',
        coverTrailerFileId: version.coverTrailerFileId || '',
        versionId: version.id,
      });
      setVersionStatus(version.status);
    } else {
      // No version for this language yet
      setVersionContent({
        title: '',
        description: '',
        completionMessage: '',
        busInfo: '',
        coverImageFileId: '',
        coverTrailerFileId: '',
        versionId: '',
      });
    }
  }, [selectedLanguage, versions]);

  // Auto-save tour metadata mutation
  const updateTourMutation = useMutation({
    mutationFn: (data: typeof tourData) => toursApi.updateTour(tourId, data),
    onSuccess: () => {
      console.log('✅ Tour metadata saved successfully');
      queryClient.invalidateQueries({ queryKey: ['tour', tourId] });
      setLastSavedTour(JSON.stringify(tourData));
      setSavingTour(false);
    },
    onError: (error: any) => {
      console.error('❌ Failed to save tour metadata:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Failed to save tour: ${error.response?.data?.message || error.message}`);
      setSavingTour(false);
    },
  });

  // Save route mutation
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

  // Create new version mutation
  const createVersionMutation = useMutation({
    mutationFn: (data: { language: string; title: string; description: string; completionMessage?: string; busInfo?: string; coverImageFileId?: string; coverTrailerFileId?: string }) =>
      versionsApi.createVersion(tourId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-versions', tourId] });
      setShowAddLanguageModal(false);
      setNewLanguage('');
    },
  });

  // Update version mutation
  const updateVersionMutation = useMutation({
    mutationFn: ({ versionId, data }: { versionId: string; data: any }) =>
      versionsApi.updateVersion(tourId, versionId, data),
    onSuccess: () => {
      console.log('✅ Version content saved successfully');
      queryClient.invalidateQueries({ queryKey: ['tour-versions', tourId] });
    },
    onError: (error: any) => {
      console.error('❌ Failed to save version content:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Failed to save version: ${error.response?.data?.message || error.message}`);
    },
  });

  // Publish/unpublish version mutation
  const publishMutation = useMutation({
    mutationFn: ({ versionId, action }: { versionId: string; action: 'publish' | 'unpublish' }) => {
      if (action === 'publish') {
        return versionsApi.publishVersion(tourId, versionId);
      } else {
        return versionsApi.unpublishVersion(tourId, versionId);
      }
    },
    onSuccess: (data) => {
      console.log('✅ Version status updated successfully');
      setVersionStatus(data.status);
      queryClient.invalidateQueries({ queryKey: ['tour-versions', tourId] });
      queryClient.invalidateQueries({ queryKey: ['tours'] });
    },
    onError: (error: any) => {
      console.error('❌ Failed to update version status:', error);
      alert(`Failed to update status: ${error.response?.data?.message || error.message}`);
    },
  });

  // Auto-save tour metadata on blur
  const handleTourFieldBlur = () => {
    const current = JSON.stringify(tourData);
    if (current !== lastSavedTour && !savingTour) {
      setSavingTour(true);
      updateTourMutation.mutate(tourData);
    }
  };

  // Update point location mutation
  const updatePointMutation = useMutation({
    mutationFn: ({ pointId, data }: { pointId: string; data: any }) =>
      pointsApi.updatePoint(tourId, pointId, data),
    onSuccess: () => {
      refetchPoints();
    },
  });

  // Save/update point content mutation
  const savePointContentMutation = useMutation({
    mutationFn: async (pointId: string) => {
      const content = pointContent[pointId];
      if (!content) {
        console.warn('⚠️ No content found for point:', pointId);
        return;
      }

      // Helper to remove undefined values and empty optional fields
      const cleanOptionalFields = (obj: any) => {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          // Always keep title and language (required fields)
          if (key === 'title' || key === 'language') {
            cleaned[key] = value;
          }
          // For optional fields, only include if they have a value
          else if (value !== undefined && value !== '' && value !== null) {
            cleaned[key] = value;
          }
        }
        return cleaned;
      };

      const basePayload = cleanOptionalFields({
        title: content.title || 'Untitled',
        description: content.description,
        audioFileId: content.audioFileId,
        imageFileId: content.imageFileId,
        subtitleFileId: content.subtitleFileId,
      });

      if (content.localizationId) {
        // Update existing localization (no language property)
        console.log('💾 Updating point content:', { pointId, payload: basePayload });
        console.log('Payload JSON:', JSON.stringify(basePayload, null, 2));
        return pointLocalizationsApi.updateLocalization(
          tourId,
          pointId,
          content.localizationId,
          basePayload
        );
      } else {
        // Create new localization (include language only - backend derives tourVersionId)
        const createPayload = cleanOptionalFields({
          language: selectedLanguage,
          ...basePayload,
        });
        console.log('💾 Creating point content:', { pointId, payload: createPayload });
        console.log('Payload JSON:', JSON.stringify(createPayload, null, 2));
        return pointLocalizationsApi.createLocalization(tourId, pointId, createPayload);
      }
    },
    onSuccess: () => {
      console.log('✅ Point content saved successfully');
      queryClient.invalidateQueries({ queryKey: ['all-localizations', tourId, selectedLanguage] });
    },
    onError: (error: any) => {
      console.error('❌ Failed to save point content:', error);
      console.error('Full error response:', JSON.stringify(error.response?.data, null, 2));
      const errorMsg = Array.isArray(error.response?.data?.message)
        ? error.response.data.message.join(', ')
        : error.response?.data?.message || error.message;
      console.error('Error message:', errorMsg);
      alert(`Failed to save point content: ${errorMsg}`);
    },
  });

  // Handle map points change (add, remove, reorder, drag)
  const handleMapPointsChange = async (newPoints: MapPoint[]) => {
    setMapPoints(newPoints);

    // If points were added
    if (newPoints.length > mapPoints.length) {
      const addedPoint = newPoints[newPoints.length - 1];
      try {
        const created = await pointsApi.createPoint(tourId, {
          latitude: addedPoint.latitude,
          longitude: addedPoint.longitude,
          sequenceOrder: addedPoint.sequenceOrder,
          triggerRadiusMeters: addedPoint.triggerRadiusMeters,
        });

        // Update the temp ID with real ID
        setMapPoints((prev) =>
          prev.map((p) => (p.id === addedPoint.id ? { ...p, id: created.id } : p))
        );
        refetchPoints();
      } catch (error: any) {
        console.error('Failed to create point:', error);
        // Remove the temporary point if creation failed
        setMapPoints((prev) => prev.filter((p) => p.id !== addedPoint.id));
        alert(`Failed to create point: ${error?.response?.data?.message || error.message || 'Unknown error'}`);
      }
    }

    // If points were removed
    else if (newPoints.length < mapPoints.length) {
      const removedPoint = mapPoints.find((p) => !newPoints.find((np) => np.id === p.id));
      if (removedPoint && !removedPoint.id.startsWith('temp-')) {
        try {
          await pointsApi.deletePoint(tourId, removedPoint.id);
          refetchPoints();
        } catch (error) {
          console.error('Failed to delete point:', error);
        }
      }
    }

    // If point was dragged (coordinates changed)
    else {
      for (const newPoint of newPoints) {
        const oldPoint = mapPoints.find((p) => p.id === newPoint.id);
        if (
          oldPoint &&
          (oldPoint.latitude !== newPoint.latitude || oldPoint.longitude !== newPoint.longitude)
        ) {
          if (!newPoint.id.startsWith('temp-')) {
            updatePointMutation.mutate({
              pointId: newPoint.id,
              data: {
                lat: newPoint.latitude,
                lng: newPoint.longitude,
                order: newPoint.sequenceOrder,
                defaultTriggerRadiusMeters: newPoint.triggerRadiusMeters,
              },
            });
          }
        }
      }
    }
  };

  // Handle marker click - scroll to point
  const handleMarkerClick = (pointId: string) => {
    setSelectedPointId(pointId);
    const element = pointRefs.current[pointId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Handle file selection
  const handleFileSelect = (pointId: string, type: 'audio' | 'image' | 'subtitle', file: MediaFile) => {
    setPointContent((prev) => ({
      ...prev,
      [pointId]: {
        ...prev[pointId],
        [`${type}FileId`]: file.id,
      },
    }));
    setMediaModalOpen(null);

    // Auto-save after file selection
    setTimeout(() => {
      savePointContentMutation.mutate(pointId);
    }, 100);
  };

  // Clear file
  const clearFile = (pointId: string, type: 'audio' | 'image' | 'subtitle') => {
    setPointContent((prev) => ({
      ...prev,
      [pointId]: {
        ...prev[pointId],
        [`${type}FileId`]: '',
      },
    }));

    // Auto-save after clearing file
    setTimeout(() => {
      savePointContentMutation.mutate(pointId);
    }, 100);
  };

  // Save version content (title & description)
  const handleVersionContentBlur = () => {
    if (!selectedLanguage) return;

    if (versionContent.versionId) {
      // Update existing version
      updateVersionMutation.mutate({
        versionId: versionContent.versionId,
        data: {
          title: versionContent.title,
          description: versionContent.description,
          completionMessage: versionContent.completionMessage,
          busInfo: versionContent.busInfo,
          coverImageFileId: versionContent.coverImageFileId || null,
          coverTrailerFileId: versionContent.coverTrailerFileId || null,
        },
      });
    } else if (versionContent.title) {
      // Create new version if title is provided
      createVersionMutation.mutate({
        language: selectedLanguage,
        title: versionContent.title,
        description: versionContent.description,
        completionMessage: versionContent.completionMessage || undefined,
        busInfo: versionContent.busInfo || undefined,
        coverImageFileId: versionContent.coverImageFileId || undefined,
        coverTrailerFileId: versionContent.coverTrailerFileId || undefined,
      });
    }
  };

  // Handle tour cover image selection
  const handleTourCoverSelect = (file: MediaFile) => {
    setVersionContent((prev) => {
      const updated = {
        ...prev,
        coverImageFileId: file.id,
      };

      // Auto-save with the updated state
      setTimeout(() => {
        if (updated.versionId) {
          updateVersionMutation.mutate({
            versionId: updated.versionId,
            data: {
              title: updated.title,
              description: updated.description,
              completionMessage: updated.completionMessage,
              coverImageFileId: file.id,
            },
          });
        }
      }, 100);

      return updated;
    });
    setTourCoverModalOpen(false);
  };

  // Clear tour cover image
  const clearTourCover = () => {
    setVersionContent((prev) => {
      const updated = {
        ...prev,
        coverImageFileId: '',
      };

      // Auto-save with the updated state
      setTimeout(() => {
        if (updated.versionId) {
          updateVersionMutation.mutate({
            versionId: updated.versionId,
            data: {
              title: updated.title,
              description: updated.description,
              completionMessage: updated.completionMessage,
              coverImageFileId: null,
            },
          });
        }
      }, 100);

      return updated;
    });
  };

  // Handle tour cover trailer selection
  const handleTourTrailerSelect = (file: MediaFile) => {
    setVersionContent((prev) => {
      const updated = {
        ...prev,
        coverTrailerFileId: file.id,
      };

      // Auto-save with the updated state
      setTimeout(() => {
        if (updated.versionId) {
          updateVersionMutation.mutate({
            versionId: updated.versionId,
            data: {
              title: updated.title,
              description: updated.description,
              completionMessage: updated.completionMessage,
              coverImageFileId: updated.coverImageFileId || null,
              coverTrailerFileId: file.id,
            },
          });
        }
      }, 100);

      return updated;
    });
    setTourTrailerModalOpen(false);
  };

  // Clear tour cover trailer
  const clearTourTrailer = () => {
    setVersionContent((prev) => {
      const updated = {
        ...prev,
        coverTrailerFileId: '',
      };

      // Auto-save with the updated state
      setTimeout(() => {
        if (updated.versionId) {
          updateVersionMutation.mutate({
            versionId: updated.versionId,
            data: {
              title: updated.title,
              description: updated.description,
              completionMessage: updated.completionMessage,
              coverImageFileId: updated.coverImageFileId || null,
              coverTrailerFileId: null,
            },
          });
        }
      }, 100);

      return updated;
    });
  };

  // Add new language
  const handleAddLanguage = (lang?: string) => {
    const languageToAdd = lang || newLanguage;
    if (!languageToAdd) return;

    console.log('📝 Creating version for language:', languageToAdd);
    createVersionMutation.mutate({
      language: languageToAdd,
      title: `New ${LANGUAGE_LABELS[languageToAdd]} Tour`,
      description: '',
    });
  };

  // Delete point
  const handleDeletePoint = async (pointId: string) => {
    if (!confirm('Delete this point? This will remove all content for all languages.')) {
      return;
    }

    try {
      // Only call API if point exists in database (not a temporary point)
      if (!pointId.startsWith('temp-')) {
        await pointsApi.deletePoint(tourId, pointId);
      }

      // Remove from local state and reorder
      const updatedPoints = mapPoints
        .filter(p => p.id !== pointId)
        .map((p, index) => ({ ...p, sequenceOrder: index + 1 }));

      setMapPoints(updatedPoints);

      // Clear selection if deleted point was selected
      if (selectedPointId === pointId) {
        setSelectedPointId(null);
      }

      // Refetch points to sync with database (only if it was a real point)
      if (!pointId.startsWith('temp-')) {
        refetchPoints();
      }
    } catch (error) {
      console.error('Failed to delete point:', error);
      alert('Failed to delete point. Please try again.');
    }
  };

  // Move point up in order
  const handleMovePointUp = async (pointId: string, currentIndex: number) => {
    if (currentIndex === 0) return; // Already at the top

    const newPoints = [...mapPoints];
    const temp = newPoints[currentIndex];
    newPoints[currentIndex] = newPoints[currentIndex - 1];
    newPoints[currentIndex - 1] = temp;

    // Update sequence order
    const reorderedPoints = newPoints.map((p, idx) => ({ ...p, sequenceOrder: idx + 1 }));
    setMapPoints(reorderedPoints);

    // Only call API if all points are saved (no temp IDs)
    const allSaved = reorderedPoints.every(p => !p.id.startsWith('temp-'));
    if (allSaved) {
      try {
        await pointsApi.reorderPoints(tourId, reorderedPoints.map(p => p.id));
        refetchPoints();
      } catch (error) {
        console.error('Failed to reorder points:', error);
        alert('Failed to reorder points. Please try again.');
      }
    }
  };

  // Move point down in order
  const handleMovePointDown = async (pointId: string, currentIndex: number) => {
    if (currentIndex === mapPoints.length - 1) return; // Already at the bottom

    const newPoints = [...mapPoints];
    const temp = newPoints[currentIndex];
    newPoints[currentIndex] = newPoints[currentIndex + 1];
    newPoints[currentIndex + 1] = temp;

    // Update sequence order
    const reorderedPoints = newPoints.map((p, idx) => ({ ...p, sequenceOrder: idx + 1 }));
    setMapPoints(reorderedPoints);

    // Only call API if all points are saved (no temp IDs)
    const allSaved = reorderedPoints.every(p => !p.id.startsWith('temp-'));
    if (allSaved) {
      try {
        await pointsApi.reorderPoints(tourId, reorderedPoints.map(p => p.id));
        refetchPoints();
      } catch (error) {
        console.error('Failed to reorder points:', error);
        alert('Failed to reorder points. Please try again.');
      }
    }
  };

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

  if (tourLoading) {
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
          title="Edit Tour"
          description={`Unified editor for ${tour?.slug || 'tour'}`}
          actions={
            <Link
              href="/tours"
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-900"
            >
              <ArrowLeft size={18} />
              <span>Back</span>
            </Link>
          }
        />

        <div className="p-4 lg:p-8 space-y-6">
          {/* Tour Settings Section */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Tour Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Slug</label>
                <input
                  type="text"
                  value={tourData.slug}
                  onChange={(e) => setTourData({ ...tourData, slug: e.target.value })}
                  onBlur={handleTourFieldBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">City</label>
                <input
                  type="text"
                  value={tourData.defaultCity}
                  onChange={(e) => setTourData({ ...tourData, defaultCity: e.target.value })}
                  onBlur={handleTourFieldBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Duration (min)</label>
                <input
                  type="number"
                  value={tourData.defaultDurationMinutes}
                  onChange={(e) =>
                    setTourData({ ...tourData, defaultDurationMinutes: parseInt(e.target.value) || 0 })
                  }
                  onBlur={handleTourFieldBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={tourData.defaultDistanceKm}
                  onChange={(e) =>
                    setTourData({ ...tourData, defaultDistanceKm: parseFloat(e.target.value) || 0 })
                  }
                  onBlur={handleTourFieldBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Difficulty</label>
                <select
                  value={tourData.defaultDifficulty}
                  onChange={(e) => {
                    setTourData({ ...tourData, defaultDifficulty: e.target.value });
                    handleTourFieldBlur();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                >
                  <option value="facile">Facile</option>
                  <option value="medio">Medio</option>
                  <option value="difficile">Difficile</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tourData.isProtected}
                    onChange={(e) => {
                      setTourData({ ...tourData, isProtected: e.target.checked });
                      handleTourFieldBlur();
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-900">Protected</span>
                </label>
              </div>
            </div>

            {/* Language Selector */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-900">
                  Content Language
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddLanguageModal(!showAddLanguageModal)}
                  className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                >
                  + Add Language
                </button>
              </div>

              {/* Language Tabs */}
              {versions.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      {versions.map((version) => (
                        <button
                          key={version.id}
                          type="button"
                          onClick={() => {
                            console.log('Language button clicked:', version.language);
                            setSelectedLanguage(version.language);
                          }}
                          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                            selectedLanguage === version.language
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          }`}
                        >
                          {LANGUAGE_LABELS[version.language]}
                        </button>
                      ))}
                    </div>

                    {/* Status Badge */}
                    {selectedLanguage && versionContent.versionId && (
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        versionStatus === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {versionStatus === 'published' ? '✓ Published' : 'Draft'}
                      </span>
                    )}

                    {/* Publish/Unpublish Button */}
                    {selectedLanguage && versionContent.versionId && (
                      <button
                        type="button"
                        onClick={() => {
                          const action = versionStatus === 'published' ? 'unpublish' : 'publish';
                          publishMutation.mutate({ versionId: versionContent.versionId, action });
                        }}
                        disabled={publishMutation.isPending}
                        className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                          versionStatus === 'published'
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50'
                            : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                        }`}
                      >
                        {publishMutation.isPending ? 'Saving...' : (
                          versionStatus === 'published' ? 'Unpublish' : 'Publish'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No languages added yet. Click "+ Add Language" to start.</p>
              )}

              {/* Add Language Dropdown */}
              {showAddLanguageModal && (
                <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Add New Language</h3>
                  <div className="flex gap-2">
                    {Object.entries(LANGUAGE_LABELS)
                      .filter(([lang]) => !versions.find(v => v.language === lang))
                      .map(([lang, label]) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => {
                            handleAddLanguage(lang);
                            setSelectedLanguage(lang);
                          }}
                          className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                        >
                          {label}
                        </button>
                      ))}
                    {Object.keys(LANGUAGE_LABELS).length === versions.length && (
                      <p className="text-sm text-gray-500 italic">All languages already added</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {savingTour && (
              <p className="text-sm text-gray-900 mt-2">Saving tour settings...</p>
            )}
          </div>

          {/* Tour Version Content (Title & Description) */}
          {selectedLanguage && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Tour Content ({LANGUAGE_LABELS[selectedLanguage]})
              </h2>

              {/* Warning Alert for Published Versions */}
              {versionStatus === 'published' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        You are editing a published version
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Changes will be immediately visible to users viewing this tour in the mobile app.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Tour Title *
                  </label>
                  <input
                    type="text"
                    value={versionContent.title}
                    onChange={(e) => setVersionContent({ ...versionContent, title: e.target.value })}
                    onBlur={handleVersionContentBlur}
                    placeholder="Enter tour title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">This title will appear in the mobile app</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Tour Description
                  </label>
                  <textarea
                    value={versionContent.description}
                    onChange={(e) => setVersionContent({ ...versionContent, description: e.target.value })}
                    onBlur={handleVersionContentBlur}
                    placeholder="Enter tour description"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">Provide a detailed description of the tour</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Tour Cover Image
                  </label>
                  {versionContent.coverImageFileId ? (
                    <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50">
                      <span className="text-sm text-gray-900">Cover image selected</span>
                      <button
                        onClick={clearTourCover}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setTourCoverModalOpen(true)}
                      className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-900 bg-white hover:bg-gray-50"
                    >
                      <Folder size={16} className="mr-2" />
                      Browse Images
                    </button>
                  )}
                  <p className="text-xs text-gray-500 mt-1">This image will appear as the tour cover in the mobile app</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Tour Cover Trailer
                  </label>
                  {versionContent.coverTrailerFileId ? (
                    <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50">
                      <span className="text-sm text-gray-900">Cover trailer selected</span>
                      <button
                        onClick={clearTourTrailer}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setTourTrailerModalOpen(true)}
                      className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-900 bg-white hover:bg-gray-50"
                    >
                      <Folder size={16} className="mr-2" />
                      Browse Videos
                    </button>
                  )}
                  <p className="text-xs text-gray-500 mt-1">This video will auto-play on the tour card in the mobile app discover page (optional)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Closing Message (optional)
                  </label>
                  <textarea
                    value={versionContent.completionMessage}
                    onChange={(e) => setVersionContent({ ...versionContent, completionMessage: e.target.value })}
                    onBlur={handleVersionContentBlur}
                    placeholder="Message shown to users when they complete the tour (e.g., thank you message, social media CTA, donation request)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">This message appears on the completion screen in the mobile app</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Bus Info (optional)
                  </label>
                  <textarea
                    value={versionContent.busInfo}
                    onChange={(e) => setVersionContent({ ...versionContent, busInfo: e.target.value })}
                    onBlur={handleVersionContentBlur}
                    placeholder="Bus schedule or transportation info (e.g., bus line, departure times). Leave empty to hide the Info Bus button."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">If provided, an "Info Bus" button will appear on the completion screen</p>
                </div>

                {(updateVersionMutation.isPending || createVersionMutation.isPending) && (
                  <p className="text-sm text-gray-500 italic">Saving...</p>
                )}
                {updateVersionMutation.isSuccess && (
                  <p className="text-sm text-green-600">✓ Saved</p>
                )}
              </div>
            </div>
          )}

          {/* Route Editor Section */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Tour Route</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {routePolyline
                    ? `Route configured with ${routePolyline.split(';').length} points`
                    : 'Draw the walking path for this tour'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  This is the physical route visitors will follow. It's shared across all language versions.
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
                  points={[]}
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

          {/* Main Editor: Map + Points */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Map Editor */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MapPin size={20} className="mr-2" />
                Map & Locations
              </h2>
              <p className="text-sm text-gray-900 mb-4">
                Click to add points, drag markers to move them
              </p>
              <div className="h-[600px] border border-gray-200 rounded-lg overflow-hidden relative">
                <MapEditor
                  points={mapPoints}
                  onPointsChange={handleMapPointsChange}
                  editable={true}
                  onMarkerClick={handleMarkerClick}
                />
              </div>
            </div>

            {/* Right: Point Content Editor */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Point Content</h2>
              {mapPoints.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-900">No points yet. Click on the map to add points.</p>
                </div>
              ) : (
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                  {mapPoints.map((point, idx) => {
                    const content = pointContent[point.id] || {
                      title: '',
                      description: '',
                      audioFileId: '',
                      imageFileId: '',
                      subtitleFileId: '',
                    };
                    const isSelected = selectedPointId === point.id;

                    return (
                      <div
                        key={point.id}
                        ref={(el) => {
                          pointRefs.current[point.id] = el;
                        }}
                        className={`p-4 border-2 rounded-lg transition-colors ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* Point Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                              {point.sequenceOrder}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {content.title || `Point ${point.sequenceOrder}`}
                              </h3>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleMovePointUp(point.id, idx)}
                              disabled={idx === 0}
                              className={`p-2 rounded-md transition-colors ${
                                idx === 0
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                              }`}
                              title="Move up"
                            >
                              <ArrowUp size={18} />
                            </button>
                            <button
                              onClick={() => handleMovePointDown(point.id, idx)}
                              disabled={idx === mapPoints.length - 1}
                              className={`p-2 rounded-md transition-colors ${
                                idx === mapPoints.length - 1
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                              }`}
                              title="Move down"
                            >
                              <ArrowDown size={18} />
                            </button>
                            <button
                              onClick={() => handleDeletePoint(point.id)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete point"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Location & Dimensions */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Location & Dimensions</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-900 mb-1">
                                Latitude
                              </label>
                              <input
                                type="number"
                                step="0.000001"
                                value={point.latitude}
                                onChange={(e) => {
                                  const newLat = parseFloat(e.target.value);
                                  if (!isNaN(newLat)) {
                                    const updatedPoints = mapPoints.map(p =>
                                      p.id === point.id ? { ...p, latitude: newLat } : p
                                    );
                                    setMapPoints(updatedPoints);
                                  }
                                }}
                                onBlur={() => {
                                  // Get the latest point values from state
                                  const currentPoint = mapPoints.find(p => p.id === point.id);
                                  if (currentPoint) {
                                    updatePointMutation.mutate({
                                      pointId: currentPoint.id,
                                      data: {
                                        lat: currentPoint.latitude,
                                        lng: currentPoint.longitude,
                                        order: currentPoint.sequenceOrder,
                                        defaultTriggerRadiusMeters: currentPoint.triggerRadiusMeters,
                                      },
                                    });
                                  }
                                }}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-gray-900"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-900 mb-1">
                                Longitude
                              </label>
                              <input
                                type="number"
                                step="0.000001"
                                value={point.longitude}
                                onChange={(e) => {
                                  const newLng = parseFloat(e.target.value);
                                  if (!isNaN(newLng)) {
                                    const updatedPoints = mapPoints.map(p =>
                                      p.id === point.id ? { ...p, longitude: newLng } : p
                                    );
                                    setMapPoints(updatedPoints);
                                  }
                                }}
                                onBlur={() => {
                                  // Get the latest point values from state
                                  const currentPoint = mapPoints.find(p => p.id === point.id);
                                  if (currentPoint) {
                                    updatePointMutation.mutate({
                                      pointId: currentPoint.id,
                                      data: {
                                        lat: currentPoint.latitude,
                                        lng: currentPoint.longitude,
                                        order: currentPoint.sequenceOrder,
                                        defaultTriggerRadiusMeters: currentPoint.triggerRadiusMeters,
                                      },
                                    });
                                  }
                                }}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-gray-900"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-900 mb-1">
                                Radius (m)
                              </label>
                              <input
                                type="number"
                                min="5"
                                max="500"
                                step="10"
                                value={point.triggerRadiusMeters}
                                onChange={(e) => {
                                  const newRadius = parseInt(e.target.value);
                                  if (!isNaN(newRadius)) {
                                    const updatedPoints = mapPoints.map(p =>
                                      p.id === point.id ? { ...p, triggerRadiusMeters: newRadius } : p
                                    );
                                    setMapPoints(updatedPoints);
                                  }
                                }}
                                onBlur={() => {
                                  // Get the latest point values from state
                                  const currentPoint = mapPoints.find(p => p.id === point.id);
                                  if (currentPoint) {
                                    updatePointMutation.mutate({
                                      pointId: currentPoint.id,
                                      data: {
                                        lat: currentPoint.latitude,
                                        lng: currentPoint.longitude,
                                        order: currentPoint.sequenceOrder,
                                        defaultTriggerRadiusMeters: currentPoint.triggerRadiusMeters,
                                      },
                                    });
                                  }
                                }}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-gray-900"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Content Fields */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">
                              Title *
                            </label>
                            <input
                              type="text"
                              value={content.title}
                              onChange={(e) =>
                                setPointContent({
                                  ...pointContent,
                                  [point.id]: { ...content, title: e.target.value },
                                })
                              }
                              onBlur={() => {
                                // Auto-save on blur
                                savePointContentMutation.mutate(point.id);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900"
                              placeholder="Point title"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">
                              Description
                            </label>
                            <textarea
                              value={content.description}
                              onChange={(e) =>
                                setPointContent({
                                  ...pointContent,
                                  [point.id]: { ...content, description: e.target.value },
                                })
                              }
                              onBlur={() => {
                                // Auto-save on blur
                                savePointContentMutation.mutate(point.id);
                              }}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900"
                              placeholder="Point description"
                            />
                          </div>

                          {/* Audio */}
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">Audio *</label>
                            {content.audioFileId ? (
                              <MediaFilePreview
                                fileId={content.audioFileId}
                                type="audio"
                                onRemove={() => clearFile(point.id, 'audio')}
                              />
                            ) : (
                              <button
                                onClick={() => setMediaModalOpen({ pointId: point.id, type: 'audio' })}
                                className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-900 bg-white hover:bg-gray-50"
                              >
                                <Folder size={16} className="mr-2" />
                                Browse Audio
                              </button>
                            )}
                          </div>

                          {/* Subtitles */}
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">Subtitles</label>
                            {content.subtitleFileId ? (
                              <MediaFilePreview
                                fileId={content.subtitleFileId}
                                type="subtitle"
                                onRemove={() => clearFile(point.id, 'subtitle')}
                              />
                            ) : (
                              <button
                                onClick={() => setMediaModalOpen({ pointId: point.id, type: 'subtitle' })}
                                className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-900 bg-white hover:bg-gray-50"
                              >
                                <Folder size={16} className="mr-2" />
                                Browse Subtitles
                              </button>
                            )}
                          </div>

                          {/* Image */}
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">Image</label>
                            {content.imageFileId ? (
                              <MediaFilePreview
                                fileId={content.imageFileId}
                                type="image"
                                onRemove={() => clearFile(point.id, 'image')}
                              />
                            ) : (
                              <button
                                onClick={() => setMediaModalOpen({ pointId: point.id, type: 'image' })}
                                className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-900 bg-white hover:bg-gray-50"
                              >
                                <Folder size={16} className="mr-2" />
                                Browse Images
                              </button>
                            )}
                          </div>

                          {/* Auto-save status */}
                          {savePointContentMutation.isPending && (
                            <div className="text-sm text-gray-500 italic">
                              Saving...
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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

        {/* Tour Cover Image Modal */}
        <MediaBrowserModal
          isOpen={tourCoverModalOpen}
          onClose={() => setTourCoverModalOpen(false)}
          onSelect={handleTourCoverSelect}
          fileType="image"
          title="Select Tour Cover Image"
        />

        {/* Tour Cover Trailer Modal */}
        <MediaBrowserModal
          isOpen={tourTrailerModalOpen}
          onClose={() => setTourTrailerModalOpen(false)}
          onSelect={handleTourTrailerSelect}
          fileType="video"
          title="Select Tour Cover Trailer"
        />
      </MainLayout>
    </ProtectedRoute>
  );
}
