import { getAdminStats } from '@/lib/actions/admin'
import Link from 'next/link'
import { Users, BarChart2, TrendingUp, Activity } from 'lucide-react'
import { PLAN_BADGE } from '@/lib/utils/admin-constants'

export const dynamic = 'force-dynamic'

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
}: {
  title: string
  value: string | number
  sub: string
  icon: React.ElementType
}) {
  return (
    <div className="surface-panel rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs text-ink-faint uppercase tracking-wider">{title}</p>
        <div className="w-8 h-8 rounded-lg bg-surface-2 border border-edge flex items-center justify-center text-accent">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-ink tabular-nums">{value}</p>
      <p className="text-xs text-ink-faint mt-1">{sub}</p>
    </div>
  )
}

export default async function AdminOverviewPage() {
  const result = await getAdminStats()

  if (!result.success || !result.data) {
    return (
      <div className="p-8">
        <p className="text-sm text-danger">Failed to load stats: {result.error}</p>
      </div>
    )
  }

  const {
    totalUsers,
    totalVisualizations,
    newUsersThisMonth,
    newVizsThisMonth,
    planDistribution,
    recentUsers,
    recentVisualizations,
  } = result.data

  const planCounts = planDistribution.reduce<Record<string, number>>((acc, p) => {
    acc[p._id] = p.count
    return acc
  }, {})

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-ink">Overview</h1>
        <p className="text-sm text-ink-faint mt-0.5">Platform at a glance</p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={totalUsers.toLocaleString()}
          sub="all time"
          icon={Users}
        />
        <StatCard
          title="Total Vizs"
          value={totalVisualizations.toLocaleString()}
          sub="all time"
          icon={BarChart2}
        />
        <StatCard
          title="New Users"
          value={`+${newUsersThisMonth}`}
          sub="last 30 days"
          icon={TrendingUp}
        />
        <StatCard
          title="New Vizs"
          value={`+${newVizsThisMonth}`}
          sub="last 30 days"
          icon={Activity}
        />
      </div>

      {/* Plan breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {(['free', 'pro', 'enterprise'] as const).map(plan => (
          <div key={plan} className="surface-panel rounded-xl p-4">
            <p className="text-xs text-ink-faint uppercase tracking-wider mb-2">{plan}</p>
            <p className="text-xl font-semibold text-ink tabular-nums">
              {(planCounts[plan] ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-ink-faint mt-0.5">users</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="surface-panel rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-edge flex items-center justify-between">
            <h2 className="text-sm font-medium text-ink">Recent Users</h2>
            <Link href="/admin/users" className="text-xs text-accent hover:text-accent-hover hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-edge/60">
            {recentUsers.length === 0 && (
              <p className="px-5 py-8 text-sm text-ink-faint text-center">No users yet</p>
            )}
            {recentUsers.map(u => {
              const name =
                u.firstName || u.lastName
                  ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
                  : u.email ?? u.clerkId
              return (
                <div key={u.clerkId} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-ink truncate">{name}</p>
                    <p className="text-xs text-ink-faint truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${PLAN_BADGE[u.plan] ?? PLAN_BADGE.free}`}>
                      {u.plan}
                    </span>
                    <Link
                      href={`/admin/users/${u.clerkId}`}
                      className="text-xs text-ink-faint hover:text-accent transition-colors"
                    >
                      →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent visualizations */}
        <div className="surface-panel rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-edge flex items-center justify-between">
            <h2 className="text-sm font-medium text-ink">Recent Visualizations</h2>
            <Link href="/admin/visualizations" className="text-xs text-accent hover:text-accent-hover hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-edge/60">
            {recentVisualizations.length === 0 && (
              <p className="px-5 py-8 text-sm text-ink-faint text-center">No visualizations yet</p>
            )}
            {recentVisualizations.map(v => (
              <div key={v._id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-ink truncate">{v.title}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    v.isPublic ? 'bg-success/15 text-success' : 'bg-surface-2 text-ink-faint'
                  }`}
                >
                  {v.isPublic ? 'public' : 'private'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
