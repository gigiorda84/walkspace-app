'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { toursApi } from '@/lib/api/tours';
import { Tour } from '@/types/api';

type TourFormData = {
  slug: string;
  defaultCity: string;
  defaultDurationMinutes: number;
  defaultDistanceKm: number;
  defaultDifficulty: string;
  isProtected: boolean;
};

export default function NewTourPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TourFormData>();

  const createMutation = useMutation({
    mutationFn: (data: TourFormData) => toursApi.createTour(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      router.push('/tours');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create tour');
    },
  });

  const onSubmit = (data: TourFormData) => {
    setError('');
    createMutation.mutate(data);
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <PageHeader
          title="Create New Tour"
          description="Add a new sonic walking tour"
          actions={
            <Link
              href="/tours"
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-900"
            >
              <ArrowLeft size={18} />
              <span>Back to Tours</span>
            </Link>
          }
        />

        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6 space-y-6">
                  <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-900">
                      Slug *
                    </label>
                    <input
                      type="text"
                      id="slug"
                      {...register('slug', {
                        required: 'Slug is required',
                        pattern: {
                          value: /^[a-z0-9-]+$/,
                          message: 'Slug must be lowercase letters, numbers, and hyphens only',
                        },
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
                      placeholder="rome-ancient-sounds"
                    />
                    {errors.slug && (
                      <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="defaultCity" className="block text-sm font-medium text-gray-900">
                      City *
                    </label>
                    <input
                      type="text"
                      id="defaultCity"
                      {...register('defaultCity', { required: 'City is required' })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
                      placeholder="Rome"
                    />
                    {errors.defaultCity && (
                      <p className="mt-1 text-sm text-red-600">{errors.defaultCity.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label
                        htmlFor="defaultDurationMinutes"
                        className="block text-sm font-medium text-gray-900"
                      >
                        Duration (minutes) *
                      </label>
                      <input
                        type="number"
                        id="defaultDurationMinutes"
                        {...register('defaultDurationMinutes', {
                          required: 'Duration is required',
                          min: { value: 1, message: 'Duration must be at least 1 minute' },
                          valueAsNumber: true,
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
                        placeholder="60"
                      />
                      {errors.defaultDurationMinutes && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.defaultDurationMinutes.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="defaultDistanceKm" className="block text-sm font-medium text-gray-900">
                        Distance (km) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        id="defaultDistanceKm"
                        {...register('defaultDistanceKm', {
                          required: 'Distance is required',
                          min: { value: 0.1, message: 'Distance must be at least 0.1 km' },
                          valueAsNumber: true,
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
                        placeholder="3.5"
                      />
                      {errors.defaultDistanceKm && (
                        <p className="mt-1 text-sm text-red-600">{errors.defaultDistanceKm.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="defaultDifficulty" className="block text-sm font-medium text-gray-900">
                        Difficulty
                      </label>
                      <select
                        id="defaultDifficulty"
                        {...register('defaultDifficulty')}
                        defaultValue="facile"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
                      >
                        <option value="facile">Facile</option>
                        <option value="medio">Medio</option>
                        <option value="difficile">Difficile</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="isProtected"
                          type="checkbox"
                          {...register('isProtected')}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="isProtected" className="font-medium text-gray-900">
                          Protected Tour
                        </label>
                        <p className="text-gray-900">
                          Require a voucher code to access this tour
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <Link
                  href="/tours"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-900 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Tour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
