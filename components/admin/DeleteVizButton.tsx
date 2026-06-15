'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { adminDeleteVisualization } from '@/lib/actions/admin'

export default function DeleteVizButton({ vizId }: { vizId: string }) {
  const [confirmed, setConfirmed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleClick = () => {
    if (!confirmed) {
      setConfirmed(true)
      setTimeout(() => setConfirmed(false), 3000)
      return
    }
    startTransition(async () => {
      const result = await adminDeleteVisualization(vizId)
      if (result.success) {
        toast.success('Visualization deleted')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to delete')
        setConfirmed(false)
      }
    })
  }

  if (isPending) {
    return <span className="text-xs text-ink-faint px-2 py-1">…</span>
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`text-xs px-2 py-1 rounded transition-colors ${
        confirmed
          ? 'bg-danger/15 text-danger hover:bg-danger/25'
          : 'text-ink-faint hover:text-danger'
      }`}
    >
      {confirmed ? 'Confirm?' : <Trash2 className="w-3.5 h-3.5" />}
    </button>
  )
}
