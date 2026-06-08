import { getAdminStats } from '@/lib/actions/admin'
import Link from 'next/link'
import { Users, BarChart2, TrendingUp, Activity } from 'lucide-react'

export const dynamic = 'force-dynamic'

const PLAN_BADGE: Record<string, string> = {
  enterprise: 'bg-yellow-500/15 text-yellow-400',
  pro: 'bg-indigo-500/15 text-indigo-400',
  free: 'bg-white/5 text-white/40',
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  title: string
  value: string | number
  sub: string
  icon: React.ElementType
  accent: string
}) {
  return (
    <div className="bg-slate-800 rounded-xl border border-white/6 p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs text-white/40 uppercase tracking-wider">{title}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-white tabular-nums">{value}</p>
      <p className="text-xs text-white/30 mt-1">{sub}</p>
    </div>
  )
}

export default async function AdminOverviewPage() {
  const result = await getAdminStats()

  if (!result.success || !result.data) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-400">Failed to load stats: {result.error}</p>
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
        <h1 className="text-xl font-semibold text-white">Overview</h1>
        <p className="text-sm text-white/30 mt-0.5">Platform at a glance</p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={totalUsers.toLocaleString()}
          sub="all time"
          icon={Users}
          accent="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          title="Total Vizs"
          value={totalVisualizations.toLocaleString()}
          sub="all time"
          icon={BarChart2}
          accent="bg-purple-500/15 text-purple-400"
        />
        <StatCard
          title="New Users"
          value={`+${newUsersThisMonth}`}
          sub="last 30 days"
          icon={TrendingUp}
          accent="bg-green-500/15 text-green-400"
        />
        <StatCard
          title="New Vizs"
          value={`+${newVizsThisMonth}`}
          sub="last 30 days"
          icon={Activity}
          accent="bg-orange-500/15 text-orange-400"
        />
      </div>

      {/* Plan breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {(['free', 'pro', 'enterprise'] as const).map(plan => (
          <div key={plan} className="bg-slate-800 rounded-xl border border-white/6 p-4">
            <p className="text-xs text-white/30 uppercase tracking-wider mb-2">{plan}</p>
            <p className="text-xl font-semibold text-white tabular-nums">
              {(planCounts[plan] ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-white/30 mt-0.5">users</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="bg-slate-800 rounded-xl border border-white/6 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">Recent Users</h2>
            <Link href="/admin/users" className="text-xs text-indigo-400 hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recentUsers.length === 0 && (
              <p className="px-5 py-8 text-sm text-white/30 text-center">No users yet</p>
            )}
            {recentUsers.map(u => {
              const name =
                u.firstName || u.lastName
                  ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
                  : u.email ?? u.clerkId
              return (
                <div key={u.clerkId} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{name}</p>
                    <p className="text-xs text-white/30 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${PLAN_BADGE[u.plan] ?? PLAN_BADGE.free}`}>
                      {u.plan}
                    </span>
                    <Link
                      href={`/admin/users/${u.clerkId}`}
                      className="text-xs text-white/30 hover:text-indigo-400 transition-colors"
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
        <div className="bg-slate-800 rounded-xl border border-white/6 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">Recent Visualizations</h2>
            <Link href="/admin/visualizations" className="text-xs text-indigo-400 hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recentVisualizations.length === 0 && (
              <p className="px-5 py-8 text-sm text-white/30 text-center">No visualizations yet</p>
            )}
            {recentVisualizations.map(v => (
              <div key={v._id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{v.title}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    v.isPublic ? 'bg-green-500/15 text-green-400' : 'bg-white/5 text-white/30'
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
