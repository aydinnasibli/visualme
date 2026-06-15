'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { adminUpdateUserPlan } from '@/lib/actions/admin'

const PLANS = ['free', 'pro', 'enterprise'] as const

export default function UpdatePlanForm({
  clerkId,
  currentPlan,
}: {
  clerkId: string
  currentPlan: 'free' | 'pro' | 'enterprise'
}) {
  const [selected, setSelected] = useState<typeof PLANS[number]>(currentPlan)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleUpdate = () => {
    if (selected === currentPlan) return
    startTransition(async () => {
      const result = await adminUpdateUserPlan(clerkId, selected)
      if (result.success) {
        toast.success(`Plan updated to ${selected}`)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to update plan')
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1 p-1 bg-surface-2 border border-edge rounded-lg">
        {PLANS.map(plan => (
          <button
            key={plan}
            type="button"
            onClick={() => setSelected(plan)}
            className={`py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
              selected === plan
                ? 'bg-accent text-surface-0'
                : 'text-ink-faint hover:text-ink'
            }`}
          >
            {plan}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={handleUpdate}
        disabled={isPending || selected === currentPlan}
        className="w-full py-2 px-4 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm text-surface-0 font-medium transition-colors"
      >
        {isPending ? 'Updating…' : 'Apply Plan'}
      </button>
      {selected !== currentPlan && (
        <p className="text-xs text-ink-faint text-center">
          Current: <span className="text-ink-muted capitalize">{currentPlan}</span>
          {' → '}
          <span className="text-accent capitalize">{selected}</span>
        </p>
      )}
    </div>
  )
}
