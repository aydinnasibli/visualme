import { getAdminVisualizations } from '@/lib/actions/admin'
import Link from 'next/link'
import { Search } from 'lucide-react'
import DeleteVizButton from '@/components/admin/DeleteVizButton'

export const dynamic = 'force-dynamic'

export default async function AdminVisualizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const search = params.search ?? ''

  const result = await getAdminVisualizations({ page, search })

  if (!result.success || !result.data) {
    return (
      <div className="p-8">
        <p className="text-sm text-danger">Failed to load: {result.error}</p>
      </div>
    )
  }

  const { visualizations, total, totalPages } = result.data

  function buildHref(overrides: Record<string, string | number>) {
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    p.set('page', String(page))
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === '') p.delete(k)
      else p.set(k, String(v))
    })
    const qs = p.toString()
    return `/admin/visualizations${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Visualizations</h1>
        <p className="text-sm text-ink-faint mt-0.5">{total.toLocaleString()} total</p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <form method="get" action="/admin/visualizations" className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-faint pointer-events-none" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by title…"
            className="w-full surface-control rounded-lg pl-9 pr-4 py-2 text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-accent/40 transition-colors"
          />
        </form>
      </div>

      {/* Table */}
      <div className="surface-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge">
                <th className="text-left px-5 py-3 text-xs text-ink-faint font-medium">Title</th>
                <th className="text-left px-5 py-3 text-xs text-ink-faint font-medium">Visibility</th>
                <th className="text-left px-5 py-3 text-xs text-ink-faint font-medium">User</th>
                <th className="text-left px-5 py-3 text-xs text-ink-faint font-medium">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-edge/60">
              {visualizations.map(viz => (
                <tr key={viz._id} className="hover:bg-surface-2 transition-colors group">
                  <td className="px-5 py-3">
                    <p className="text-ink font-medium truncate max-w-[220px]">{viz.title}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        viz.isPublic
                          ? 'bg-success/15 text-success'
                          : 'bg-surface-2 text-ink-faint'
                      }`}
                    >
                      {viz.isPublic ? 'public' : 'private'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/users/${viz.userId}`}
                      className="text-xs text-ink-faint hover:text-accent transition-colors font-mono"
                    >
                      {viz.userId.slice(0, 16)}…
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-xs text-ink-faint whitespace-nowrap">
                    {new Date(viz.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <DeleteVizButton vizId={viz._id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visualizations.length === 0 && (
          <div className="px-5 py-14 text-center text-sm text-ink-faint">No visualizations found</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-faint">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref({ page: page - 1 })}
                className="px-3 py-1.5 surface-control rounded-lg text-xs text-ink-muted hover:text-ink transition-colors"
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref({ page: page + 1 })}
                className="px-3 py-1.5 surface-control rounded-lg text-xs text-ink-muted hover:text-ink transition-colors"
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
