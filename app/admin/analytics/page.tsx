import { getAdminAnalytics, getAdminStats } from '@/lib/actions/admin'
import AnalyticsCharts from '@/components/admin/AnalyticsCharts'

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
  const [analyticsResult, statsResult] = await Promise.all([
    getAdminAnalytics(),
    getAdminStats(),
  ])

  if (!analyticsResult.success || !analyticsResult.data) {
    return (
      <div className="p-8">
        <p className="text-sm text-danger">Failed to load analytics: {analyticsResult.error}</p>
      </div>
    )
  }

  const stats = statsResult.data

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-ink">Analytics</h1>
        <p className="text-sm text-ink-faint mt-0.5">Platform usage insights</p>
      </div>

      {/* Summary row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Tokens Used', value: analyticsResult.data.tokenByTier.reduce((s, t) => s + t.totalUsed, 0).toLocaleString() },
            { label: 'Avg Tokens / User', value: Math.round(analyticsResult.data.tokenByTier.reduce((s, t) => s + t.avgUsed * t.userCount, 0) / Math.max(1, analyticsResult.data.tokenByTier.reduce((s, t) => s + t.userCount, 0))).toLocaleString() },
            { label: 'Viz Created (14d)', value: analyticsResult.data.vizByDay.reduce((s, d) => s + d.count, 0).toLocaleString() },
            { label: 'Total Users', value: stats.totalUsers.toLocaleString() },
          ].map(item => (
            <div key={item.label} className="surface-panel rounded-xl p-4">
              <p className="text-xs text-ink-faint mb-1.5">{item.label}</p>
              <p className="text-xl font-semibold text-ink tabular-nums">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      <AnalyticsCharts data={analyticsResult.data} />
    </div>
  )
}
