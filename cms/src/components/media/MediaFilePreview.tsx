'use client';

import { useQuery } from '@tanstack/react-query';
import { X, Volume2, FileText, Image as ImageIcon } from 'lucide-react';
import { mediaApi } from '@/lib/api/media';
import { MediaFile } from '@/types/api';

interface MediaFilePreviewProps {
  fileId: string;
  type: 'audio' | 'image' | 'subtitle';
  onRemove: () => void;
}

export function MediaFilePreview({ fileId, type, onRemove }: MediaFilePreviewProps) {
  const { data: file, isLoading } = useQuery({
    queryKey: ['media-file', fileId],
    queryFn: () => mediaApi.getMedia(fileId),
    enabled: !!fileId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-between p-2 border border-gray-300 rounded-md bg-gray-50">
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex items-center justify-between p-2 border border-gray-300 rounded-md bg-gray-50">
        <span className="text-sm text-gray-500">File not found</span>
        <button
          onClick={onRemove}
          className="text-red-600 hover:text-red-800"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  // Use the signed URL provided by the backend
  const fileUrl = file.url;

  return (
    <div className="border border-gray-300 rounded-md bg-white">
      {/* Header with filename and remove button */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {type === 'audio' && <Volume2 size={16} className="text-gray-500 flex-shrink-0" />}
          {type === 'subtitle' && <FileText size={16} className="text-gray-500 flex-shrink-0" />}
          {type === 'image' && <ImageIcon size={16} className="text-gray-500 flex-shrink-0" />}
          <span className="text-sm font-medium text-gray-900 truncate" title={file.originalFilename}>
            {file.originalFilename}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="text-red-600 hover:text-red-800 ml-2 flex-shrink-0"
          title="Remove file"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content preview */}
      <div className="p-3">
        {type === 'audio' && (
          <div className="space-y-2">
            <audio
              controls
              className="w-full h-10"
              src={fileUrl}
              preload="metadata"
            >
              Your browser does not support the audio element.
            </audio>
            <div className="text-xs text-gray-500">
              {file.fileSizeBytes && `Size: ${formatFileSize(file.fileSizeBytes)}`}
            </div>
          </div>
        )}

        {type === 'image' && (
          <div className="space-y-2">
            <img
              src={fileUrl}
              alt={file.originalFilename}
              className="w-full h-32 object-cover rounded border border-gray-200"
            />
            <div className="text-xs text-gray-500">
              {file.fileSizeBytes && `Size: ${formatFileSize(file.fileSizeBytes)}`}
            </div>
          </div>
        )}

        {type === 'subtitle' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText size={14} />
              <span>Subtitle file (.srt)</span>
            </div>
            <div className="text-xs text-gray-500">
              {file.fileSizeBytes && `Size: ${formatFileSize(file.fileSizeBytes)}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
