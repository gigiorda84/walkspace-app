'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { analyticsApi, AnalyticsPeriod } from '@/lib/api/client';
import type {
  AnalyticsOverview,
  DurationAnalytics,
  EngagementAnalytics,
  TourAnalyticsItem,
  SessionItem,
} from '@/types/api';

// Stat Card Component
function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

// Progress Bar Component
function ProgressBar({ label, value, total, color = 'blue' }: { label: string; value: number; total: number; color?: string }) {
  const percent = total > 0 ? (value / total) * 100 : 0;
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
  };
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-900 font-medium">{value} ({percent.toFixed(1)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${colorClasses[color]} h-2 rounded-full`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [duration, setDuration] = useState<DurationAnalytics | null>(null);
  const [engagement, setEngagement] = useState<EngagementAnalytics | null>(null);
  const [tours, setTours] = useState<TourAnalyticsItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  async function fetchAnalytics() {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, durationData, engagementData, toursData, sessionsData] = await Promise.all([
        analyticsApi.getOverview(period),
        analyticsApi.getDuration(period),
        analyticsApi.getEngagement(period),
        analyticsApi.getTours(period),
        analyticsApi.getSessions(period),
      ]);
      setOverview(overviewData);
      setDuration(durationData);
      setEngagement(engagementData);
      setTours(toursData);
      setSessions(sessionsData);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(format: 'csv' | 'json') {
    setExporting(true);
    try {
      await analyticsApi.exportEvents(period, format);
    } catch (err) {
      console.error('Failed to export analytics:', err);
    } finally {
      setExporting(false);
    }
  }

  const periodLabels: Record<AnalyticsPeriod, string> = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
    'all': 'All time',
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h1>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as AnalyticsPeriod)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
          >
            {Object.entries(periodLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Overview Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Tour Starts" value={overview?.totalStarts || 0} />
          <StatCard title="Total Completions" value={overview?.totalCompletions || 0} />
          <StatCard title="Unique Devices" value={overview?.uniqueDevices || 0} />
          <StatCard
            title="Completion Rate"
            value={overview && overview.totalStarts > 0
              ? `${((overview.totalCompletions / overview.totalStarts) * 100).toFixed(1)}%`
              : '0%'
            }
          />
        </div>

        {/* Platform & Trigger Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-4">Platform Distribution</h3>
            <ProgressBar
              label="iOS"
              value={overview?.platformBreakdown.ios || 0}
              total={(overview?.platformBreakdown.ios || 0) + (overview?.platformBreakdown.android || 0)}
              color="blue"
            />
            <ProgressBar
              label="Android"
              value={overview?.platformBreakdown.android || 0}
              total={(overview?.platformBreakdown.ios || 0) + (overview?.platformBreakdown.android || 0)}
              color="green"
            />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-4">Trigger Method</h3>
            <ProgressBar
              label="GPS (On-site)"
              value={overview?.triggerBreakdown.gps || 0}
              total={(overview?.triggerBreakdown.gps || 0) + (overview?.triggerBreakdown.manual || 0)}
              color="purple"
            />
            <ProgressBar
              label="Manual (Remote)"
              value={overview?.triggerBreakdown.manual || 0}
              total={(overview?.triggerBreakdown.gps || 0) + (overview?.triggerBreakdown.manual || 0)}
              color="orange"
            />
          </div>
        </div>
      </section>

      {/* Duration Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Tour Duration</h2>
        <p className="text-sm text-gray-500 mb-4">
          Averages use only completions that reported a duration and trigger type. Older
          Android builds don&apos;t send these yet, so they&apos;re excluded here (fixed in an upcoming app release).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-500">Completed via GPS</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {duration?.avgDurationGpsCompleted || 0} min
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {duration?.totalGpsCompleted || 0} tours
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-500">Completed via Play Button</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {duration?.avgDurationManualCompleted || 0} min
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {duration?.totalManualCompleted || 0} tours
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-500">Abandoned (Not Completed)</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {duration?.avgDurationAbandoned || 0} min
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {duration?.totalAbandoned || 0} tours
            </p>
          </div>
        </div>
      </section>

      {/* Engagement Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Post-Tour Engagement</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-4">Contact & Social</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-600">Total Contact Clicks</span>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">{engagement?.totalContactClicks || 0}</span>
                  <span className="text-gray-500 text-sm ml-2">({engagement?.totalContactPercent || 0}% of completions)</span>
                </div>
              </div>
              {engagement?.channelBreakdown.map((channel) => (
                <div key={channel.channel} className="flex justify-between items-center">
                  <span className="text-gray-600 capitalize">{channel.channel}</span>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">{channel.clicks}</span>
                    <span className="text-gray-500 text-sm ml-2">({channel.percentOfCompletions}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-4">Donations</h3>
            <div className="text-center pt-2 pb-4">
              <p className="text-5xl font-bold text-purple-600">{engagement?.donationClicks || 0}</p>
              <p className="text-gray-500 mt-2">Donation link clicks</p>
              <p className="text-sm text-gray-500 mt-1">
                {engagement?.donationPercent || 0}% of {engagement?.totalCompletions || 0} completed tours
              </p>
            </div>
            <div className="space-y-3 border-t border-gray-100 pt-4">
              {(engagement?.donationBreakdown?.length || 0) === 0 ? (
                <p className="text-sm text-gray-400 text-center">No donation clicks yet</p>
              ) : (
                engagement?.donationBreakdown.map((d) => (
                  <div key={d.provider} className="flex justify-between items-center">
                    <span className="text-gray-600 capitalize">
                      {d.provider === 'paypal' ? 'PayPal' : d.provider === 'satispay' ? 'Satispay' : d.provider}
                    </span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{d.clicks}</span>
                      <span className="text-gray-500 text-sm ml-2">({d.percentOfCompletions}%)</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Per-Tour Analytics */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Per-Tour Analytics</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tour</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Starts</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Completions</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Duration</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">GPS</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Manual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tours.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No tour data available for this period
                  </td>
                </tr>
              ) : (
                tours.map((tour) => (
                  <tr key={tour.tourId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{tour.tourName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">{tour.starts}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">{tour.completions}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">{tour.completionRate}%</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">{tour.avgDurationMinutes} min</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">{tour.gpsTriggered}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">{tour.manualTriggered}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </section>

      {/* Recent Sessions */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tour</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trigger</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No sessions found for this period
                  </td>
                </tr>
              ) : (
                sessions.map((session, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{session.tourName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(session.startedAt).toLocaleDateString()}{' '}
                      {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{session.device}</div>
                      <div className="text-xs text-gray-400">{session.osVersion}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        session.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : session.status === 'abandoned'
                          ? 'bg-orange-100 text-orange-700'
                          : session.status === 'incomplete'
                          ? 'bg-gray-200 text-gray-600'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      {session.durationMinutes != null ? `${session.durationMinutes} min` : '\u2014'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">{session.pointsTriggered}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{session.triggerType || '\u2014'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{session.language || '\u2014'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </section>
      </div>
    </MainLayout>
  </ProtectedRoute>
  );
}
