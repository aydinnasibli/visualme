'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, BarChart2, TrendingUp, ArrowLeft, Shield, Menu, X } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users, exact: false },
  { href: '/admin/visualizations', label: 'Visualizations', icon: BarChart2, exact: false },
  { href: '/admin/analytics', label: 'Analytics', icon: TrendingUp, exact: false },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between h-14 px-4 bg-surface-1 border-b border-edge">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-surface-2 border border-edge flex items-center justify-center text-accent">
            <Shield className="w-4 h-4" />
          </div>
          <p className="text-sm font-semibold text-ink leading-tight">Admin</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
          className="w-9 h-9 -mr-2 flex items-center justify-center text-ink-faint hover:text-ink transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-56 shrink-0 h-full flex flex-col bg-surface-1 border-r border-edge transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 py-5 border-b border-edge flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-surface-2 border border-edge flex items-center justify-center text-accent">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink leading-tight">Admin</p>
              <p className="text-[11px] text-ink-faint">Visuologia</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="lg:hidden w-7 h-7 flex items-center justify-center text-ink-faint hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-surface-2 text-ink font-medium'
                    : 'text-ink-faint hover:text-ink hover:bg-surface-2'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-2 py-3 border-t border-edge">
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
        </div>
      </aside>
    </>
  )
}
