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
    return <span className="text-xs text-white/20 px-2 py-1">…</span>
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`text-xs px-2 py-1 rounded transition-colors ${
        confirmed
          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          : 'text-white/25 hover:text-red-400'
      }`}
    >
      {confirmed ? 'Confirm?' : <Trash2 className="w-3.5 h-3.5" />}
    </button>
  )
}
