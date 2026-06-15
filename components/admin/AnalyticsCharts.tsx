'use client'

import ReactECharts from 'echarts-for-react'
import { useTheme } from 'next-themes'
import { useMounted } from '@/lib/hooks/useMounted'
import type { AnalyticsData } from '@/lib/actions/admin'

const PLAN_LABEL: Record<string, string> = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' }

function colors(isDark: boolean) {
  return {
    accent: isDark ? '#5B8FFF' : '#1A5DD9',
    free: isDark ? '#7C8FAE' : '#9CAFC9',
    enterprise: isDark ? '#FFC144' : '#C87800',
    ghost: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
    text: isDark ? '#8899B4' : '#5C7090',
    grid: isDark ? '#1E2A3C' : '#D4DBE8',
  }
}

function tierColor(tier: string, c: ReturnType<typeof colors>) {
  return tier === 'pro' ? c.accent : tier === 'enterprise' ? c.enterprise : c.free
}

const TOOLTIP = {
  backgroundColor: 'var(--color-surface-2)',
  borderColor: 'var(--color-edge)',
  borderWidth: 1,
  textStyle: { color: 'var(--color-ink)', fontSize: 12 },
  extraCssText: 'border-radius: 8px;',
}

function Card({ title, span, children }: { title: string; span?: boolean; children: React.ReactNode }) {
  return (
    <div className={`surface-panel rounded-xl p-5 ${span ? 'lg:col-span-2' : ''}`}>
      <h3 className="text-sm font-medium text-ink mb-5">{title}</h3>
      {children}
    </div>
  )
}

function EmptyChart({ height }: { height: number }) {
  return (
    <div style={{ height }} className="flex items-center justify-center text-ink-faint text-sm">
      No data yet
    </div>
  )
}

export default function AnalyticsCharts({ data }: { data: AnalyticsData }) {
  const { resolvedTheme } = useTheme()
  const mounted = useMounted()

  const vizData = data.vizByDay.map(d => ({
    name: new Date(`${d._id}T00:00:00Z`).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      timeZone: 'UTC',
    }),
    count: d.count,
  }))

  const planData = data.userByPlan.map(d => ({ name: d._id, value: d.count }))

  const tokenData = data.tokenByTier.map(d => ({
    tier: d._id,
    used: Math.round(d.avgUsed),
    limit: Math.round(d.totalLimit / (d.userCount || 1)),
  }))

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="surface-panel rounded-xl p-5 lg:col-span-2 h-[280px] animate-pulse" />
        <div className="surface-panel rounded-xl p-5 h-[240px] animate-pulse" />
        <div className="surface-panel rounded-xl p-5 h-[240px] animate-pulse" />
      </div>
    )
  }

  const isDark = resolvedTheme !== 'light'
  const c = colors(isDark)

  const vizOption = {
    backgroundColor: 'transparent',
    grid: { top: 10, right: 10, bottom: 50, left: 40 },
    xAxis: {
      type: 'category',
      data: vizData.map(d => d.name),
      axisLabel: { color: c.text, fontSize: 11, rotate: 35 },
      axisLine: { lineStyle: { color: c.grid } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: c.text, fontSize: 11 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: c.grid, type: 'dashed' } },
    },
    tooltip: { ...TOOLTIP, trigger: 'axis' },
    series: [
      {
        type: 'bar',
        data: vizData.map(d => d.count),
        itemStyle: { color: c.accent, borderRadius: [3, 3, 0, 0] },
        barMaxWidth: 32,
      },
    ],
  }

  const planOption = {
    backgroundColor: 'transparent',
    color: planData.map(d => tierColor(d.name, c)),
    tooltip: { ...TOOLTIP, trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['55%', '80%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        label: { show: false },
        itemStyle: { borderRadius: 4 },
        data: planData.map(d => ({ name: PLAN_LABEL[d.name] ?? d.name, value: d.value })),
      },
    ],
  }

  const tokenOption = {
    backgroundColor: 'transparent',
    grid: { top: 10, right: 10, bottom: 30, left: 40 },
    xAxis: {
      type: 'category',
      data: tokenData.map(d => PLAN_LABEL[d.tier] ?? d.tier),
      axisLabel: { color: c.text, fontSize: 12 },
      axisLine: { lineStyle: { color: c.grid } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: c.text, fontSize: 11 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: c.grid, type: 'dashed' } },
    },
    tooltip: { ...TOOLTIP, trigger: 'axis' },
    series: [
      {
        type: 'bar',
        name: 'Avg limit',
        data: tokenData.map(d => d.limit),
        itemStyle: { color: c.ghost, borderRadius: [3, 3, 0, 0] },
        barMaxWidth: 40,
      },
      {
        type: 'bar',
        name: 'Avg used',
        data: tokenData.map(d => ({ value: d.used, itemStyle: { color: tierColor(d.tier, c) } })),
        itemStyle: { borderRadius: [3, 3, 0, 0] },
        barMaxWidth: 40,
      },
    ],
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Visualizations created over time */}
      <Card title="Visualizations Created (last 14 days)" span>
        {vizData.length > 0 ? (
          <ReactECharts option={vizOption} notMerge opts={{ renderer: 'canvas' }} style={{ height: 220, width: '100%' }} />
        ) : (
          <EmptyChart height={220} />
        )}
      </Card>

      {/* Users by Plan */}
      <Card title="Users by Plan">
        {planData.length > 0 ? (
          <div className="flex items-center gap-6">
            <ReactECharts option={planOption} notMerge opts={{ renderer: 'canvas' }} style={{ height: 180, width: 180 }} />
            <div className="space-y-2">
              {planData.map(entry => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tierColor(entry.name, c) }} />
                  <span className="text-xs text-ink-muted capitalize">{PLAN_LABEL[entry.name] ?? entry.name}</span>
                  <span className="text-xs text-ink font-medium ml-auto pl-4">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyChart height={180} />
        )}
      </Card>

      {/* Token Usage by Tier */}
      <Card title="Avg Token Usage by Tier">
        {tokenData.length > 0 ? (
          <ReactECharts option={tokenOption} notMerge opts={{ renderer: 'canvas' }} style={{ height: 180, width: '100%' }} />
        ) : (
          <EmptyChart height={180} />
        )}
      </Card>
    </div>
  )
}
