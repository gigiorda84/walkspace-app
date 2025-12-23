'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Ticket, Eye, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { vouchersApi, VoucherBatch } from '@/lib/api/vouchers';
import { toursApi } from '@/lib/api/tours';

export default function VouchersPage() {
  const queryClient = useQueryClient();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<VoucherBatch | null>(null);

  // Fetch voucher batches
  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['voucher-batches'],
    queryFn: () => vouchersApi.getAllBatches(),
  });

  // Fetch tours for display
  const { data: tours = [] } = useQuery({
    queryKey: ['tours'],
    queryFn: () => toursApi.getAllTours(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (batchId: string) => vouchersApi.deleteBatch(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voucher-batches'] });
      setDeleteDialogOpen(false);
      setBatchToDelete(null);
    },
  });

  const getTourName = (tourId: string) => {
    const tour = tours.find(t => t.id === tourId);
    return tour?.slug || 'Unknown Tour';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = (batch: VoucherBatch) => {
    setBatchToDelete(batch);
    setDeleteDialogOpen(true);
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <PageHeader
          title="Vouchers"
          description="Manage voucher batches and access codes for tours"
          actions={
            <Link
              href="/vouchers/new"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus size={20} />
              <span>New Batch</span>
            </Link>
          }
        />

        <div className="p-8">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-900">Loading voucher batches...</p>
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Ticket size={48} className="mx-auto text-gray-900 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No voucher batches yet</h3>
              <p className="text-gray-900 mb-4">Create your first voucher batch to generate access codes</p>
              <Link
                href="/vouchers/new"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <Plus size={20} />
                <span>Create Batch</span>
              </Link>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Batch Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Tour
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Codes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {batches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {batch.name}
                          </div>
                          <div className="text-sm text-gray-900">
                            {batch.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getTourName(batch.tourId)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Ticket size={16} className="mr-2 text-gray-900" />
                          {batch.voucherCount || 0} codes
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar size={16} className="mr-2" />
                          {formatDate(batch.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        <Link
                          href={`/vouchers/${batch.id}`}
                          className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                        >
                          <Eye size={16} className="mr-1" />
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(batch)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                        >
                          <Trash2 size={16} className="mr-1" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary Stats */}
          {batches.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Total Batches</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{batches.length}</p>
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-full">
                    <Ticket size={24} className="text-indigo-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Total Codes</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {batches.reduce((sum, b) => sum + (b.voucherCount || 0), 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingUp size={24} className="text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Protected Tours</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {new Set(batches.map(b => b.tourId)).size}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Ticket size={24} className="text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <ConfirmDialog
          isOpen={deleteDialogOpen}
          onCancel={() => setDeleteDialogOpen(false)}
          onConfirm={() => {
            if (batchToDelete) {
              deleteMutation.mutate(batchToDelete.id);
            }
          }}
          title="Delete Voucher Batch"
          message={`Are you sure you want to delete the batch "${batchToDelete?.name}"? This will delete all associated voucher codes. This action cannot be undone.`}
          confirmLabel="Delete"
          isLoading={deleteMutation.isPending}
        />
      </MainLayout>
    </ProtectedRoute>
  );
}
