'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { AnalyticsData } from '@/lib/actions/admin'

const PLAN_COLORS: Record<string, string> = {
  free: '#64748b',
  pro: '#526efa',
  enterprise: '#f59e0b',
}

const TIER_COLORS: Record<string, string> = {
  free: '#64748b',
  pro: '#526efa',
  enterprise: '#f59e0b',
}

const tooltipStyle = {
  backgroundColor: '#19212e',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  color: '#f5f5f4',
  fontSize: '12px',
}

export default function AnalyticsCharts({ data }: { data: AnalyticsData }) {
  const vizData = data.vizByDay.map(d => ({
    name: d._id,
    count: d.count,
  }))

  const planData = data.userByPlan.map(d => ({
    name: d._id,
    value: d.count,
  }))

  const tokenData = data.tokenByTier.map(d => ({
    tier: d._id,
    used: Math.round(d.avgUsed),
    limit: Math.round(d.totalLimit / (d.userCount || 1)),
    users: d.userCount,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Visualizations created over time */}
      <div className="bg-slate-800 rounded-xl border border-white/6 p-5 lg:col-span-2">
        <h3 className="text-sm font-medium text-white mb-5">Visualizations Created (last 14 days)</h3>
        {vizData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={vizData} margin={{ top: 0, right: 0, left: -20, bottom: 40 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="count" fill="#526efa" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-white/30 text-sm">
            No data yet
          </div>
        )}
      </div>

      {/* Users by Plan */}
      <div className="bg-slate-800 rounded-xl border border-white/6 p-5">
        <h3 className="text-sm font-medium text-white mb-5">Users by Plan</h3>
        {planData.length > 0 ? (
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {planData.map(entry => (
                    <Cell
                      key={entry.name}
                      fill={PLAN_COLORS[entry.name] ?? '#526efa'}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {planData.map(entry => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PLAN_COLORS[entry.name] ?? '#526efa' }}
                  />
                  <span className="text-xs text-white/50 capitalize">{entry.name}</span>
                  <span className="text-xs text-white font-medium ml-auto pl-4">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-white/30 text-sm">
            No data yet
          </div>
        )}
      </div>

      {/* Token Usage by Tier */}
      <div className="bg-slate-800 rounded-xl border border-white/6 p-5">
        <h3 className="text-sm font-medium text-white mb-5">Avg Token Usage by Tier</h3>
        {tokenData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={tokenData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="tier"
                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }}
              />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                formatter={(value: number, name: string) => [
                  value,
                  name === 'used' ? 'Avg tokens used' : 'Avg token limit',
                ]}
              />
              <Bar dataKey="limit" fill="rgba(255,255,255,0.08)" radius={[3, 3, 0, 0]} name="limit" />
              <Bar
                dataKey="used"
                radius={[3, 3, 0, 0]}
                name="used"
              >
                {tokenData.map(entry => (
                  <Cell
                    key={entry.tier}
                    fill={TIER_COLORS[entry.tier] ?? '#526efa'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-white/30 text-sm">
            No data yet
          </div>
        )}
      </div>
    </div>
  )
}
