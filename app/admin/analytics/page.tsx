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
        <p className="text-sm text-red-400">Failed to load analytics: {analyticsResult.error}</p>
      </div>
    )
  }

  const stats = statsResult.data

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Analytics</h1>
        <p className="text-sm text-white/30 mt-0.5">Platform usage insights</p>
      </div>

      {/* Summary row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Tokens Used', value: analyticsResult.data.tokenByTier.reduce((s, t) => s + t.totalUsed, 0).toLocaleString() },
            { label: 'Avg Tokens / User', value: Math.round(analyticsResult.data.tokenByTier.reduce((s, t) => s + t.avgUsed * t.userCount, 0) / Math.max(1, analyticsResult.data.tokenByTier.reduce((s, t) => s + t.userCount, 0))).toLocaleString() },
            { label: 'Viz Types Used', value: analyticsResult.data.vizByType.length },
            { label: 'Total Users', value: stats.totalUsers.toLocaleString() },
          ].map(item => (
            <div key={item.label} className="bg-[#19212e] rounded-xl border border-white/[0.06] p-4">
              <p className="text-xs text-white/30 mb-1.5">{item.label}</p>
              <p className="text-xl font-semibold text-white tabular-nums">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      <AnalyticsCharts data={analyticsResult.data} />
    </div>
  )
}
