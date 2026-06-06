import { getAdminVisualizations } from '@/lib/actions/admin'
import Link from 'next/link'
import { Search } from 'lucide-react'
import DeleteVizButton from '@/components/admin/DeleteVizButton'

export const dynamic = 'force-dynamic'

const VIZ_TYPES = [
  'network_graph', 'mind_map', 'tree_diagram', 'timeline', 'gantt_chart',
  'animated_timeline', 'flowchart', 'sankey_diagram', 'swimlane_diagram',
  'line_chart', 'bar_chart', 'scatter_plot', 'heatmap', 'radar_chart',
  'pie_chart', 'comparison_table', 'parallel_coordinates', 'word_cloud',
  'syntax_diagram',
] as const

const TYPE_QUICK_FILTERS = ['', 'network_graph', 'mind_map', 'flowchart', 'bar_chart', 'pie_chart']

export default async function AdminVisualizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; type?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const search = params.search ?? ''
  const type = params.type ?? ''

  const result = await getAdminVisualizations({ page, search, type })

  if (!result.success || !result.data) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-400">Failed to load: {result.error}</p>
      </div>
    )
  }

  const { visualizations, total, totalPages } = result.data

  function buildHref(overrides: Record<string, string | number>) {
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    if (type) p.set('type', type)
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
        <h1 className="text-xl font-semibold text-white">Visualizations</h1>
        <p className="text-sm text-white/30 mt-0.5">{total.toLocaleString()} total</p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <form method="get" action="/admin/visualizations" className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by title…"
            className="w-full bg-slate-800 border border-white/6 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/40 transition-colors"
          />
          {type && <input type="hidden" name="type" value={type} />}
        </form>

        <div className="flex flex-wrap gap-1.5">
          {TYPE_QUICK_FILTERS.map(t => (
            <Link
              key={t || 'all'}
              href={buildHref({ type: t, page: 1 })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                type === t
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : 'bg-slate-800 text-white/35 hover:text-white border border-white/6'
              }`}
            >
              {t ? t.replace(/_/g, ' ') : 'All types'}
            </Link>
          ))}
          {type && !TYPE_QUICK_FILTERS.includes(type) && (
            <span className="px-3 py-1.5 rounded-lg text-xs bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              {type.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-white/6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/6">
                <th className="text-left px-5 py-3 text-xs text-white/30 font-medium">Title</th>
                <th className="text-left px-5 py-3 text-xs text-white/30 font-medium">Type</th>
                <th className="text-left px-5 py-3 text-xs text-white/30 font-medium">Visibility</th>
                <th className="text-left px-5 py-3 text-xs text-white/30 font-medium">User</th>
                <th className="text-left px-5 py-3 text-xs text-white/30 font-medium">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {visualizations.map(viz => (
                <tr key={viz._id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-3">
                    <p className="text-white font-medium truncate max-w-[220px]">{viz.title}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-white/40">{viz.type.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        viz.isPublic
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-white/5 text-white/30'
                      }`}
                    >
                      {viz.isPublic ? 'public' : 'private'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/users/${viz.userId}`}
                      className="text-xs text-white/30 hover:text-indigo-400 transition-colors font-mono"
                    >
                      {viz.userId.slice(0, 16)}…
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-xs text-white/25 whitespace-nowrap">
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
          <div className="px-5 py-14 text-center text-sm text-white/25">No visualizations found</div>
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
