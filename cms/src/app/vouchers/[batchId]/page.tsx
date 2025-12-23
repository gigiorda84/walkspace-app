'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, Ticket, CheckCircle, XCircle, Calendar } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { vouchersApi } from '@/lib/api/vouchers';
import { toursApi } from '@/lib/api/tours';

export default function VoucherBatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.batchId as string;

  // Fetch batch details
  const { data: batch, isLoading: isBatchLoading } = useQuery({
    queryKey: ['voucher-batch', batchId],
    queryFn: () => vouchersApi.getBatch(batchId),
  });

  // Fetch vouchers in this batch
  const { data: vouchers = [], isLoading: isVouchersLoading } = useQuery({
    queryKey: ['vouchers', batchId],
    queryFn: () => vouchersApi.getVouchersByBatch(batchId),
  });

  // Fetch tour details
  const { data: tour } = useQuery({
    queryKey: ['tour', batch?.tourId],
    queryFn: () => batch ? toursApi.getTour(batch.tourId) : null,
    enabled: !!batch,
  });

  const handleExportCsv = async () => {
    try {
      const blob = await vouchersApi.exportBatchCsv(batchId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vouchers-${batch?.name || batchId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to export CSV');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isLoading = isBatchLoading || isVouchersLoading;

  // Calculate statistics
  const totalCodes = vouchers.length;
  const usedCodes = vouchers.filter(v => v.usesSoFar > 0).length;
  const activeCodes = vouchers.filter(v => v.isActive).length;
  const expiredCodes = vouchers.filter(v => new Date(v.expiresAt) < new Date()).length;

  return (
    <ProtectedRoute>
      <MainLayout>
        <PageHeader
          title={batch?.name || 'Voucher Batch'}
          description={batch?.description || 'Loading...'}
          actions={
            <div className="flex items-center space-x-3">
              <Link
                href="/vouchers"
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
              >
                <ArrowLeft size={18} />
                <span>Back</span>
              </Link>
              <button
                onClick={handleExportCsv}
                disabled={vouchers.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
              >
                <Download size={18} />
                <span>Export CSV</span>
              </button>
            </div>
          }
        />

        <div className="p-8">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-900">Loading batch details...</p>
            </div>
          ) : (
            <>
              {/* Batch Info */}
              <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Batch Information</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-900">Tour</dt>
                    <dd className="mt-1 text-sm text-gray-900">{tour?.slug || 'Unknown'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-900">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {batch ? formatDate(batch.createdAt) : '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-900">Total Codes</dt>
                    <dd className="mt-1 text-sm text-gray-900">{totalCodes}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-900">Used Codes</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {usedCodes} ({totalCodes > 0 ? Math.round((usedCodes / totalCodes) * 100) : 0}%)
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-900">Total</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{totalCodes}</p>
                    </div>
                    <Ticket size={20} className="text-gray-900" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-900">Active</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">{activeCodes}</p>
                    </div>
                    <CheckCircle size={20} className="text-green-400" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-900">Used</p>
                      <p className="text-2xl font-bold text-indigo-600 mt-1">{usedCodes}</p>
                    </div>
                    <CheckCircle size={20} className="text-indigo-400" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-900">Expired</p>
                      <p className="text-2xl font-bold text-red-600 mt-1">{expiredCodes}</p>
                    </div>
                    <XCircle size={20} className="text-red-400" />
                  </div>
                </div>
              </div>

              {/* Vouchers Table */}
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Voucher Codes</h3>
                </div>

                {vouchers.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket size={48} className="mx-auto text-gray-900 mb-4" />
                    <p className="text-gray-900">No voucher codes in this batch</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                            Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                            Uses
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                            Expires
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {vouchers.map((voucher) => {
                          const isExpired = new Date(voucher.expiresAt) < new Date();
                          const isExhausted = voucher.usesSoFar >= voucher.maxUses;

                          return (
                            <tr key={voucher.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-mono font-medium text-gray-900">
                                  {voucher.code}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {voucher.usesSoFar} / {voucher.maxUses}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-900">
                                  <Calendar size={14} className="mr-2" />
                                  {formatDate(voucher.expiresAt)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {isExpired ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <XCircle size={12} className="mr-1" />
                                    Expired
                                  </span>
                                ) : isExhausted ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    <XCircle size={12} className="mr-1" />
                                    Exhausted
                                  </span>
                                ) : voucher.isActive ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle size={12} className="mr-1" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <XCircle size={12} className="mr-1" />
                                    Inactive
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
