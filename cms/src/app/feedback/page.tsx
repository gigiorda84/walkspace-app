'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { feedbackApi, FeedbackSubmission, FeedbackListResponse } from '@/lib/api/client';

export default function FeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FeedbackListResponse | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchFeedback();
  }, [page]);

  async function fetchFeedback() {
    setLoading(true);
    setError(null);
    try {
      const response = await feedbackApi.getAll(page, 50);
      setData(response);
    } catch (err) {
      setError('Failed to load feedback submissions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!data?.data.length) return;

    const headers = ['Date', 'Email', 'Name', 'Feedback', 'Newsletter'];
    const rows = data.data.map((item) => [
      new Date(item.createdAt).toLocaleString(),
      item.email || '',
      item.name || '',
      (item.feedback || '').replace(/"/g, '""'),
      item.subscribeToNewsletter ? 'Yes' : 'No',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `feedback-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  if (loading && !data) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Feedback & Newsletter</h1>
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Feedback & Newsletter</h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  const submissions = data?.data || [];
  const meta = data?.meta;

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Feedback & Newsletter</h1>
              <p className="text-sm text-gray-500 mt-1">
                {meta?.total || 0} total submissions
              </p>
            </div>
            <button
              onClick={exportCSV}
              disabled={!submissions.length}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-500">Newsletter Signups</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {submissions.filter((s) => s.subscribeToNewsletter).length}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-500">Feedback Messages</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {submissions.filter((s) => s.feedback).length}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-500">With Email</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {submissions.filter((s) => s.email).length}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feedback</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Newsletter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No submissions yet
                    </td>
                  </tr>
                ) : (
                  submissions.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.email || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.name || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                        {item.feedback ? (
                          <span className="line-clamp-2">{item.feedback}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.subscribeToNewsletter ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            No
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {meta.page} of {meta.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={page === meta.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
