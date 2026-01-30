'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import { X, Music, Image as ImageIcon, FileText, Video, Upload } from 'lucide-react';
import { mediaApi } from '@/lib/api/media';
import { MediaFile } from '@/types/api';

interface MediaBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: MediaFile) => void;
  fileType?: 'audio' | 'image' | 'subtitle' | 'video';
  title?: string;
}

const FILE_TYPE_ICONS = {
  audio: Music,
  image: ImageIcon,
  subtitle: FileText,
  video: Video,
};

export function MediaBrowserModal({
  isOpen,
  onClose,
  onSelect,
  fileType,
  title = 'Select Media File',
}: MediaBrowserModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: mediaFiles = [], isLoading } = useQuery({
    queryKey: ['media', fileType, searchQuery],
    queryFn: () =>
      mediaApi.getAllMedia({
        type: fileType,
        search: searchQuery || undefined,
      }),
    enabled: isOpen,
  });

  const handleSelect = (file: MediaFile) => {
    onSelect(file);
    onClose();
    setSearchQuery('');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-2xl font-bold text-gray-900">
                    {title}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-900 hover:text-gray-900 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {isLoading && (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-900">Loading files...</p>
                  </div>
                )}

                {!isLoading && mediaFiles.length === 0 && (
                  <div className="text-center py-12">
                    <Upload size={48} className="mx-auto text-gray-900 mb-4" />
                    <p className="text-gray-900">
                      {searchQuery ? 'No files found matching your search' : 'No files available'}
                    </p>
                    <p className="text-sm text-gray-900 mt-2">
                      Upload files in the Media Library first
                    </p>
                  </div>
                )}

                {!isLoading && mediaFiles.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                    {mediaFiles.map((file) => {
                      const Icon = FILE_TYPE_ICONS[file.type];
                      return (
                        <button
                          key={file.id}
                          onClick={() => handleSelect(file)}
                          className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                        >
                          {file.type === 'image' && file.url && (
                            <div className="w-full aspect-square mb-2 rounded overflow-hidden bg-gray-100">
                              <img
                                src={file.url}
                                alt={file.originalFilename || file.filename}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {file.type !== 'image' && (
                            <div className="w-full aspect-square mb-2 flex items-center justify-center bg-gray-100 rounded">
                              <Icon size={48} className="text-gray-900 group-hover:text-blue-500" />
                            </div>
                          )}

                          <p className="text-sm font-medium text-gray-900 truncate w-full text-center">
                            {file.originalFilename || file.filename || 'Untitled'}
                          </p>
                          <p className="text-xs text-gray-900">
                            {formatFileSize(file.fileSizeBytes)}
                          </p>
                          {/* Language badge for subtitle files */}
                          {file.language && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 rounded uppercase mt-1">
                              {file.language}
                            </span>
                          )}
                          <p className="text-xs text-gray-900 mt-1">
                            v{file.version}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
