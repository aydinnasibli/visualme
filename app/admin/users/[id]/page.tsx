import { getAdminUserById } from '@/lib/actions/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, User } from 'lucide-react'
import UpdatePlanForm from '@/components/admin/UpdatePlanForm'

export const dynamic = 'force-dynamic'

const PLAN_BADGE: Record<string, string> = {
  enterprise: 'bg-warning/15 text-warning',
  pro: 'bg-accent/10 text-ink',
  free: 'bg-surface-2 text-ink-faint',
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
          className="inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft className="w-3 h-3" />
          Users
        </Link>
        <h1 className="text-xl font-semibold text-ink">{displayName}</h1>
        <p className="text-xs text-ink-faint mt-0.5 font-mono">{user.clerkId}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Profile card */}
          <div className="surface-panel rounded-xl p-5">
            <div className="flex items-center gap-3 mb-5">
              {user.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={displayName}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-surface-2 border border-edge flex items-center justify-center text-accent">
                  <User className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{displayName}</p>
                <p className="text-xs text-ink-faint truncate">{user.email}</p>
              </div>
            </div>

            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-ink-faint">Plan</dt>
                <dd>
                  <span className={`px-2 py-0.5 rounded-full ${PLAN_BADGE[user.plan] ?? PLAN_BADGE.free}`}>
                    {user.plan}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-faint">Joined</dt>
                <dd className="text-ink-muted">{new Date(user.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-faint">Total vizs</dt>
                <dd className="text-ink-muted tabular-nums">{totalVisualizations}</dd>
              </div>
              {user.lastLoginAt && (
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Last login</dt>
                  <dd className="text-ink-muted">{new Date(user.lastLoginAt).toLocaleDateString()}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Token usage */}
          {usage && (
            <div className="surface-panel rounded-xl p-5">
              <h3 className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-3">
                Token Usage
              </h3>
              <div className="flex justify-between text-xs text-ink-faint mb-1.5">
                <span>{usage.tokensUsed.toLocaleString()} used</span>
                <span>{usage.tokensLimit.toLocaleString()} limit</span>
              </div>
              <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    tokenPct > 80 ? 'bg-danger' : tokenPct > 50 ? 'bg-warning' : 'bg-accent'
                  }`}
                  style={{ width: `${tokenPct}%` }}
                />
              </div>
              <p className="text-xs text-ink-faint mt-2">
                Resets {new Date(usage.tokenResetDate).toLocaleDateString()}
              </p>
              <div className="mt-3 pt-3 border-t border-edge flex justify-between text-xs">
                <span className="text-ink-faint">Tier</span>
                <span className="text-ink-muted capitalize">{usage.tier}</span>
              </div>
            </div>
          )}

          {/* Plan management */}
          <div className="surface-panel rounded-xl p-5">
            <h3 className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-3">
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
          <div className="surface-panel rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-edge">
              <h2 className="text-sm font-medium text-ink">
                Recent Visualizations
                <span className="text-ink-faint text-xs font-normal ml-2">
                  ({totalVisualizations} total)
                </span>
              </h2>
            </div>

            {recentVisualizations.length === 0 ? (
              <div className="px-5 py-14 text-center text-sm text-ink-faint">No visualizations</div>
            ) : (
              <div className="divide-y divide-edge/60">
                {recentVisualizations.map(viz => (
                  <div key={viz._id} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm text-ink truncate">{viz.title}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          viz.isPublic
                            ? 'bg-success/15 text-success'
                            : 'bg-surface-2 text-ink-faint'
                        }`}
                      >
                        {viz.isPublic ? 'public' : 'private'}
                      </span>
                      <span className="text-xs text-ink-faint">
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
