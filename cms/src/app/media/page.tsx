'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Search, Music, Image as ImageIcon, FileText, Video, Trash2, Download } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { mediaApi } from '@/lib/api/media';
import { MediaFile } from '@/types/api';

const FILE_TYPE_ICONS = {
  audio: Music,
  image: ImageIcon,
  subtitle: FileText,
  video: Video,
};

const FILE_TYPE_LABELS = {
  audio: 'Audio',
  image: 'Image',
  subtitle: 'Subtitle',
  video: 'Video',
};

export default function MediaLibraryPage() {
  const queryClient = useQueryClient();

  const [selectedType, setSelectedType] = useState<'audio' | 'image' | 'subtitle' | 'video' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<MediaFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const [pendingSubtitleFile, setPendingSubtitleFile] = useState<File | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'fr' | 'it'>('en');

  // Fetch media files
  const { data: mediaFiles = [], isLoading } = useQuery({
    queryKey: ['media', selectedType, searchQuery],
    queryFn: () => mediaApi.getAllMedia({
      type: selectedType === 'all' ? undefined : selectedType,
      search: searchQuery || undefined,
    }),
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, language }: { file: File; language?: 'en' | 'fr' | 'it' }) => {
      const fileId = `${file.name}-${Date.now()}`;
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      const result = await mediaApi.uploadMedia(file, language, (progress) => {
        setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
      });

      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      setLanguageDialogOpen(false);
      setPendingSubtitleFile(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => mediaApi.deleteMedia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    },
  });

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      // Validate file type
      const validTypes: Record<string, string[]> = {
        audio: ['audio/mpeg', 'audio/wav', 'audio/mp3'],
        image: ['image/jpeg', 'image/png', 'image/jpg'],
        subtitle: ['text/plain', 'application/x-subrip'],
        video: ['video/mp4', 'video/quicktime', 'video/webm'],
      };

      const isValid = Object.values(validTypes).flat().includes(file.type) ||
                      file.name.endsWith('.srt');

      if (!isValid) {
        alert(`Invalid file type: ${file.name}`);
        return;
      }

      // Validate file size (50MB for audio, 10MB for images, 1MB for subtitles, 500MB for videos)
      const maxSizes: Record<string, number> = {
        audio: 50 * 1024 * 1024,
        image: 10 * 1024 * 1024,
        subtitle: 1 * 1024 * 1024,
        video: 500 * 1024 * 1024,
      };

      const fileType = file.type.startsWith('audio/') ? 'audio' :
                       file.type.startsWith('image/') ? 'image' :
                       file.type.startsWith('video/') ? 'video' : 'subtitle';

      if (file.size > maxSizes[fileType]) {
        alert(`File too large: ${file.name}. Max size: ${maxSizes[fileType] / 1024 / 1024}MB`);
        return;
      }

      // If it's a subtitle file, open language selector dialog
      if (fileType === 'subtitle') {
        setPendingSubtitleFile(file);
        setLanguageDialogOpen(true);
      } else {
        // For non-subtitle files, upload directly without language
        uploadMutation.mutate({ file });
      }
    });
  }, [uploadMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <PageHeader
          title="Media Library"
          description="Manage audio files, images, and subtitles for your tours"
        />

        <div className="p-8">
          {/* Upload Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Upload size={48} className="mx-auto text-gray-900 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload Media Files
            </h3>
            <p className="text-sm text-gray-900 mb-4">
              Drag and drop files here, or click to browse
            </p>
            <input
              type="file"
              multiple
              accept="audio/*,image/*,.srt"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer"
            >
              <Upload size={20} className="mr-2" />
              Browse Files
            </label>
            <p className="text-xs text-gray-900 mt-3">
              Audio (MP3, WAV up to 50MB) • Images (JPG, PNG up to 10MB) • Subtitles (SRT up to 1MB)
            </p>
          </div>

          {/* Upload Progress */}
          {Object.entries(uploadProgress).length > 0 && (
            <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Uploading...</h4>
              {Object.entries(uploadProgress).map(([fileId, progress]) => (
                <div key={fileId} className="mb-2">
                  <div className="flex items-center justify-between text-xs text-gray-900 mb-1">
                    <span>{fileId.split('-')[0]}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {['all', 'audio', 'image', 'subtitle', 'video'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedType === type
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                  {type !== 'all' && ` (${mediaFiles.filter(f => f.type === type).length})`}
                </button>
              ))}
            </div>

            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-900" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Media Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-900">Loading media files...</p>
            </div>
          ) : mediaFiles.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Upload size={48} className="mx-auto text-gray-900 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No media files yet</h3>
              <p className="text-gray-900">Upload your first file to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mediaFiles.map((file) => {
                const Icon = FILE_TYPE_ICONS[file.type];
                return (
                  <div
                    key={file.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-500 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Icon size={20} className="text-gray-900" />
                        <span className="text-xs font-medium text-gray-900 uppercase">
                          {FILE_TYPE_LABELS[file.type]}
                        </span>
                        {/* Language badge for subtitle files */}
                        {file.language && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 rounded uppercase">
                            {file.language}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setFileToDelete(file);
                            setDeleteDialogOpen(true);
                          }}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Image Preview */}
                    {file.type === 'image' && (
                      <div className="mb-3 bg-gray-100 rounded aspect-video flex items-center justify-center overflow-hidden">
                        <img
                          src={file.url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Audio Player */}
                    {file.type === 'audio' && (
                      <div className="mb-3">
                        <audio
                          controls
                          className="w-full"
                          preload="metadata"
                        >
                          <source src={file.url} type={file.mimeType} />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}

                    {/* Subtitle Preview (just show icon for now) */}
                    {file.type === 'subtitle' && (
                      <div className="mb-3 bg-gray-100 rounded p-4 flex items-center justify-center">
                        <FileText size={32} className="text-gray-900" />
                      </div>
                    )}

                    <h4 className="text-sm font-medium text-gray-900 mb-1 truncate" title={file.originalFilename || 'Untitled'}>
                      {file.originalFilename || `${file.type.charAt(0).toUpperCase() + file.type.slice(1)} File`}
                    </h4>
                    <p className="text-xs text-gray-900 mb-2">
                      {formatFileSize(file.fileSizeBytes)} • {formatDate(file.createdAt)}
                    </p>
                    <p className="text-xs text-gray-900 truncate font-mono" title={file.id}>
                      ID: {file.id}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <ConfirmDialog
          isOpen={deleteDialogOpen}
          onCancel={() => setDeleteDialogOpen(false)}
          onConfirm={() => {
            if (fileToDelete) {
              deleteMutation.mutate(fileToDelete.id);
            }
          }}
          title="Delete Media File"
          message="Are you sure you want to delete this file? This action cannot be undone."
          confirmLabel="Delete"
          isLoading={deleteMutation.isPending}
        />

        {/* Language Selection Dialog for Subtitles */}
        {languageDialogOpen && pendingSubtitleFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select Subtitle Language
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose the language for: <span className="font-medium">{pendingSubtitleFile.name}</span>
              </p>

              <div className="space-y-2 mb-6">
                {[
                  { value: 'en', label: 'English', flag: '🇬🇧' },
                  { value: 'fr', label: 'Français', flag: '🇫🇷' },
                  { value: 'it', label: 'Italiano', flag: '🇮🇹' },
                ].map((lang) => (
                  <label
                    key={lang.value}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedLanguage === lang.value
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="language"
                      value={lang.value}
                      checked={selectedLanguage === lang.value}
                      onChange={(e) => setSelectedLanguage(e.target.value as 'en' | 'fr' | 'it')}
                      className="mr-3"
                    />
                    <span className="text-2xl mr-3">{lang.flag}</span>
                    <span className="text-sm font-medium text-gray-900">{lang.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setLanguageDialogOpen(false);
                    setPendingSubtitleFile(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  disabled={uploadMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (pendingSubtitleFile) {
                      uploadMutation.mutate({ file: pendingSubtitleFile, language: selectedLanguage });
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  disabled={uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}
      </MainLayout>
    </ProtectedRoute>
  );
}
