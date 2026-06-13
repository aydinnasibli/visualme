import { getAdminUserById } from '@/lib/actions/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User } from 'lucide-react'
import UpdatePlanForm from '@/components/admin/UpdatePlanForm'

export const dynamic = 'force-dynamic'

const PLAN_BADGE: Record<string, string> = {
  enterprise: 'bg-yellow-500/15 text-yellow-400',
  pro: 'bg-indigo-500/15 text-indigo-400',
  free: 'bg-white/5 text-white/40',
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getAdminUserById(id)

  if (!result.success || !result.data) {
    redirect('/admin/users')
  }

  const { user, usage, totalVisualizations, recentVisualizations } = result.data

  const displayName =
    user.firstName || user.lastName
      ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
      : user.email ?? user.clerkId

  const tokenPct = usage
    ? Math.min(100, Math.round((usage.tokensUsed / usage.tokensLimit) * 100))
    : 0

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-3 h-3" />
          Users
        </Link>
        <h1 className="text-xl font-semibold text-white">{displayName}</h1>
        <p className="text-xs text-white/30 mt-0.5 font-mono">{user.clerkId}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Profile card */}
          <div className="bg-slate-800 rounded-xl border border-white/6 p-5">
            <div className="flex items-center gap-3 mb-5">
              {user.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.imageUrl}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-400" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-xs text-white/30 truncate">{user.email}</p>
              </div>
            </div>

            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-white/30">Plan</dt>
                <dd>
                  <span className={`px-2 py-0.5 rounded-full ${PLAN_BADGE[user.plan] ?? PLAN_BADGE.free}`}>
                    {user.plan}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/30">Joined</dt>
                <dd className="text-white/70">{new Date(user.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/30">Total vizs</dt>
                <dd className="text-white/70 tabular-nums">{totalVisualizations}</dd>
              </div>
              {user.lastLoginAt && (
                <div className="flex justify-between">
                  <dt className="text-white/30">Last login</dt>
                  <dd className="text-white/70">{new Date(user.lastLoginAt).toLocaleDateString()}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Token usage */}
          {usage && (
            <div className="bg-slate-800 rounded-xl border border-white/6 p-5">
              <h3 className="text-xs font-medium text-white/60 uppercase tracking-wider mb-3">
                Token Usage
              </h3>
              <div className="flex justify-between text-xs text-white/40 mb-1.5">
                <span>{usage.tokensUsed.toLocaleString()} used</span>
                <span>{usage.tokensLimit.toLocaleString()} limit</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    tokenPct > 80 ? 'bg-red-400' : tokenPct > 50 ? 'bg-yellow-400' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${tokenPct}%` }}
                />
              </div>
              <p className="text-xs text-white/25 mt-2">
                Resets {new Date(usage.tokenResetDate).toLocaleDateString()}
              </p>
              <div className="mt-3 pt-3 border-t border-white/6 flex justify-between text-xs">
                <span className="text-white/30">Tier</span>
                <span className="text-white/60 capitalize">{usage.tier}</span>
              </div>
            </div>
          )}

          {/* Plan management */}
          <div className="bg-slate-800 rounded-xl border border-white/6 p-5">
            <h3 className="text-xs font-medium text-white/60 uppercase tracking-wider mb-3">
              Manage Plan
            </h3>
            <UpdatePlanForm
              clerkId={user.clerkId}
              currentPlan={user.plan as 'free' | 'pro' | 'enterprise'}
            />
          </div>
        </div>

        {/* Right column — visualizations */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800 rounded-xl border border-white/6 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/6">
              <h2 className="text-sm font-medium text-white">
                Recent Visualizations
                <span className="text-white/25 text-xs font-normal ml-2">
                  ({totalVisualizations} total)
                </span>
              </h2>
            </div>

            {recentVisualizations.length === 0 ? (
              <div className="px-5 py-14 text-center text-sm text-white/25">No visualizations</div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {recentVisualizations.map(viz => (
                  <div key={viz._id} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{viz.title}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          viz.isPublic
                            ? 'bg-green-500/15 text-green-400'
                            : 'bg-white/5 text-white/30'
                        }`}
                      >
                        {viz.isPublic ? 'public' : 'private'}
                      </span>
                      <span className="text-xs text-white/25">
                        {new Date(viz.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
