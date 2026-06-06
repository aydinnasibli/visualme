import { getAdminUsers } from '@/lib/actions/admin'
import Link from 'next/link'
import { Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

const PLAN_BADGE: Record<string, string> = {
  enterprise: 'bg-yellow-500/15 text-yellow-400',
  pro: 'bg-indigo-500/15 text-indigo-400',
  free: 'bg-white/5 text-white/40',
}

const PLAN_FILTERS = ['', 'free', 'pro', 'enterprise'] as const

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; plan?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const search = params.search ?? ''
  const plan = (params.plan ?? '') as 'free' | 'pro' | 'enterprise' | ''

  const result = await getAdminUsers({
    page,
    search,
    plan: plan || undefined,
  })

  if (!result.success || !result.data) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-400">Failed to load users: {result.error}</p>
      </div>
    )
  }

  const { users, total, totalPages } = result.data

  function buildHref(overrides: Record<string, string | number>) {
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    if (plan) p.set('plan', plan)
    p.set('page', String(page))
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === '') p.delete(k)
      else p.set(k, String(v))
    })
    const qs = p.toString()
    return `/admin/users${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Users</h1>
        <p className="text-sm text-white/30 mt-0.5">{total.toLocaleString()} total</p>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3">
        <form method="get" action="/admin/users" className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Search name or email…"
            className="w-full bg-slate-800 border border-white/6 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/40 transition-colors"
          />
          {plan && <input type="hidden" name="plan" value={plan} />}
        </form>

        <div className="flex gap-1.5">
          {PLAN_FILTERS.map(p => (
            <Link
              key={p || 'all'}
              href={buildHref({ plan: p, page: 1 })}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors capitalize ${
                (plan || '') === p
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : 'bg-slate-800 text-white/40 hover:text-white border border-white/6'
              }`}
            >
              {p || 'All plans'}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-white/6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/6">
                <th className="text-left px-5 py-3 text-xs text-white/30 font-medium">User</th>
                <th className="text-left px-5 py-3 text-xs text-white/30 font-medium">Plan</th>
                <th className="text-left px-5 py-3 text-xs text-white/30 font-medium">Vizs</th>
                <th className="text-left px-5 py-3 text-xs text-white/30 font-medium">Tokens</th>
                <th className="text-left px-5 py-3 text-xs text-white/30 font-medium">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {users.map(user => {
                const name =
                  user.firstName || user.lastName
                    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
                    : '—'
                const tokenPct =
                  user.tokensUsed != null && user.tokensLimit
                    ? Math.min(100, Math.round((user.tokensUsed / user.tokensLimit) * 100))
                    : null

                return (
                  <tr
                    key={user.clerkId}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className="text-white font-medium">{name}</p>
                      <p className="text-xs text-white/30 mt-0.5">{user.email ?? user.clerkId}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${PLAN_BADGE[user.plan] ?? PLAN_BADGE.free}`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-white/50 tabular-nums">
                      {user.savedVisualizationsCount}
                    </td>
                    <td className="px-5 py-3">
                      {tokenPct != null ? (
                        <div>
                          <p className="text-xs text-white/40 tabular-nums">
                            {user.tokensUsed} / {user.tokensLimit}
                          </p>
                          <div className="w-20 h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-1 rounded-full ${tokenPct > 80 ? 'bg-red-400' : 'bg-indigo-500'}`}
                              style={{ width: `${tokenPct}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-white/30 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/users/${user.clerkId}`}
                        className="text-xs text-white/30 hover:text-indigo-400 transition-colors"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="px-5 py-14 text-center text-sm text-white/25">No users found</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/30">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref({ page: page - 1 })}
                className="px-3 py-1.5 bg-slate-800 border border-white/6 rounded-lg text-xs text-white/50 hover:text-white transition-colors"
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref({ page: page + 1 })}
                className="px-3 py-1.5 bg-slate-800 border border-white/6 rounded-lg text-xs text-white/50 hover:text-white transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
