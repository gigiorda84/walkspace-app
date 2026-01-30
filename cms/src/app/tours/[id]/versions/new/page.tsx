'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { versionsApi } from '@/lib/api/versions';
import { toursApi } from '@/lib/api/tours';

interface NewVersionForm {
  language: string;
  title: string;
  description: string;
  status: 'draft' | 'published';
}

const LANGUAGES = [
  { value: 'it', label: 'Italian' },
  { value: 'fr', label: 'French' },
  { value: 'en', label: 'English' },
];

export default function NewVersionPage() {
  const params = useParams();
  const router = useRouter();
  const tourId = params.id as string;

  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<NewVersionForm>({
    defaultValues: {
      language: 'it',
      status: 'draft',
    },
  });

  // Fetch tour details
  const { data: tour } = useQuery({
    queryKey: ['tour', tourId],
    queryFn: () => toursApi.getTour(tourId),
  });

  // Fetch existing versions to prevent duplicates and allow route copying
  const { data: existingVersions = [] } = useQuery({
    queryKey: ['tour-versions', tourId],
    queryFn: () => versionsApi.getVersionsByTour(tourId),
  });

  const selectedLanguage = watch('language');

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: NewVersionForm) => {
      // Check if language already exists
      const existingVersion = existingVersions.find(v => v.language === data.language);
      if (existingVersion) {
        throw new Error(`A version for ${LANGUAGES.find(l => l.value === data.language)?.label} already exists.`);
      }

      return versionsApi.createVersion(tourId, {
        language: data.language,
        title: data.title,
        description: data.description,
        status: data.status,
      });
    },
    onSuccess: () => {
      router.push(`/tours/${tourId}/versions`);
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to create version');
    },
  });

  const onSubmit = (data: NewVersionForm) => {
    setError(null);
    createMutation.mutate(data);
  };

  const availableLanguages = LANGUAGES.filter(
    lang => !existingVersions.some(v => v.language === lang.value)
  );

  return (
    <ProtectedRoute>
      <MainLayout>
        <PageHeader
          title="Create New Version"
          description={`Add a new language version for ${tour?.slug || 'tour'}`}
        />

        <div className="p-8">
          <div className="max-w-2xl bg-white shadow-sm rounded-lg p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {availableLanguages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-900 mb-4">All languages have versions already.</p>
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300"
                >
                  Go Back
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Language *
                  </label>
                  <select
                    {...register('language', { required: 'Language is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {availableLanguages.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                  {errors.language && (
                    <p className="mt-1 text-sm text-red-600">{errors.language.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    {...register('title', { required: 'Title is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter tour title in the selected language"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter tour description in the selected language"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Status
                  </label>
                  <select
                    {...register('status')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Routes are shared across all language versions. Edit in the <a href={`/tours/${tourId}/edit`} className="text-indigo-600 hover:text-indigo-700 underline">unified editor</a>.
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Version'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
