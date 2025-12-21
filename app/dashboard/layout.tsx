'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();

  return (
    <div className="h-screen flex overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Sidebar */}
      <div className="w-64 h-full flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark flex-shrink-0 z-30">
        <div className="p-6 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-2xl">auto_graph</span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">VisualMe</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Creator Studio</p>
          </div>
        </div>

        <nav className="flex-1 px-4 flex flex-col gap-2">
          <Link
            href="/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname === '/profile'
                ? 'bg-primary/10 text-primary dark:bg-surface-dark-highlight dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-dark'
            }`}
          >
            <span className="material-symbols-outlined">grid_view</span>
            <span className="text-sm font-medium">My Visualizations</span>
          </Link>

          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname === '/dashboard'
                ? 'bg-primary/10 text-primary dark:bg-surface-dark-highlight dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-dark'
            }`}
          >
            <span className="material-symbols-outlined fill-1">add_circle</span>
            <span className="text-sm font-medium">New Visualization</span>
          </Link>

          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname === '/dashboard/settings'
                ? 'bg-primary/10 text-primary dark:bg-surface-dark-highlight dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-dark'
            }`}
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm font-medium">Settings</span>
          </Link>

          <Link
            href="/dashboard/help"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname === '/dashboard/help'
                ? 'bg-primary/10 text-primary dark:bg-surface-dark-highlight dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-dark'
            }`}
          >
            <span className="material-symbols-outlined">help</span>
            <span className="text-sm font-medium">Help</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'size-9 rounded-full',
                },
              }}
            />
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-medium truncate">
                {isSignedIn ? 'My Account' : 'Guest'}
              </p>
              <p className="text-xs text-gray-500">Pro Plan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
