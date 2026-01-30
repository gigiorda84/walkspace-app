'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Ticket } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { vouchersApi, CreateVoucherBatchRequest } from '@/lib/api/vouchers';
import { toursApi } from '@/lib/api/tours';

interface NewBatchForm {
  name: string;
  description: string;
  tourId: string;
  quantity: number;
  maxUsesPerCode: number;
  expiresAt: string;
  codePrefix: string;
}

export default function NewVoucherBatchPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<NewBatchForm>({
    defaultValues: {
      quantity: 10,
      maxUsesPerCode: 1,
      codePrefix: '',
    },
  });

  // Fetch tours
  const { data: tours = [], isLoading: isToursLoading } = useQuery({
    queryKey: ['tours'],
    queryFn: () => toursApi.getAllTours(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateVoucherBatchRequest) => vouchersApi.createBatch(data),
    onSuccess: (batch) => {
      router.push(`/vouchers/${batch.id}`);
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to create voucher batch');
    },
  });

  const onSubmit = (data: NewBatchForm) => {
    setError(null);
    createMutation.mutate(data);
  };

  // Get tomorrow's date as minimum expiration
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <PageHeader
          title="Create Voucher Batch"
          description="Generate a new batch of access codes for a tour"
        />

        <div className="p-8">
          <div className="max-w-2xl bg-white shadow-sm rounded-lg p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Batch Name *
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Batch name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Summer 2025 Promotion"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Description *
                </label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Describe the purpose of this voucher batch"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Tour *
                </label>
                {isToursLoading ? (
                  <p className="text-sm text-gray-900">Loading tours...</p>
                ) : (
                  <select
                    {...register('tourId', { required: 'Tour is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a tour</option>
                    {tours.map((tour) => (
                      <option key={tour.id} value={tour.id}>
                        {tour.slug} - {tour.defaultCity}
                      </option>
                    ))}
                  </select>
                )}
                {errors.tourId && (
                  <p className="mt-1 text-sm text-red-600">{errors.tourId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Number of Codes *
                  </label>
                  <input
                    type="number"
                    {...register('quantity', {
                      required: 'Quantity is required',
                      min: { value: 1, message: 'Minimum 1 code' },
                      max: { value: 1000, message: 'Maximum 1000 codes per batch' },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="10"
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Max Uses Per Code *
                  </label>
                  <input
                    type="number"
                    {...register('maxUsesPerCode', {
                      required: 'Max uses is required',
                      min: { value: 1, message: 'Minimum 1 use' },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="1"
                  />
                  {errors.maxUsesPerCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.maxUsesPerCode.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-900">
                    How many times each code can be redeemed
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Expiration Date *
                </label>
                <input
                  type="date"
                  {...register('expiresAt', { required: 'Expiration date is required' })}
                  min={getTomorrowDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.expiresAt && (
                  <p className="mt-1 text-sm text-red-600">{errors.expiresAt.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-900">
                  Codes will expire at end of this date
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Code Prefix (Optional)
                </label>
                <input
                  type="text"
                  {...register('codePrefix', {
                    maxLength: { value: 10, message: 'Prefix too long (max 10 characters)' },
                    pattern: {
                      value: /^[A-Z0-9-]*$/,
                      message: 'Only uppercase letters, numbers, and hyphens allowed',
                    },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="SUMMER-"
                  maxLength={10}
                />
                {errors.codePrefix && (
                  <p className="mt-1 text-sm text-red-600">{errors.codePrefix.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-900">
                  Add a custom prefix to generated codes (e.g., SUMMER-ABC123)
                </p>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Ticket size={20} className="text-indigo-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-indigo-900 mb-1">
                      Voucher Generation
                    </h4>
                    <p className="text-xs text-indigo-700">
                      Codes will be automatically generated with random alphanumeric characters.
                      Each code will be unique and ready to use immediately after creation.
                    </p>
                  </div>
                </div>
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
                  {createMutation.isPending ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
