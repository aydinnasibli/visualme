'use client';

import { useUser, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <div className="h-screen flex overflow-hidden bg-[#0f1419]">
      {/* Sidebar */}
      <div className="w-60 h-full flex flex-col border-r border-[#1e2128] bg-[#0a0d11] flex-shrink-0 z-30">
        <div className="p-5 flex items-center gap-3 border-b border-[#1e2128]">
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined text-2xl font-bold">auto_awesome</span>
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-white">VisualMe</h1>
            <p className="text-xs text-gray-500">Creator Studio</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          <Link
            href="/my-visualizations"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              pathname === '/my-visualizations'
                ? 'bg-[#1e2128] text-white'
                : 'text-gray-400 hover:bg-[#1e2128]/50 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-xl">apps</span>
            <span className="text-sm font-medium">My Visualizations</span>
          </Link>

          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              pathname === '/dashboard'
                ? 'bg-[#1e2128] text-white'
                : 'text-gray-400 hover:bg-[#1e2128]/50 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-xl">add_circle</span>
            <span className="text-sm font-medium">New Visualization</span>
          </Link>

          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              pathname === '/dashboard/settings'
                ? 'bg-[#1e2128] text-white'
                : 'text-gray-400 hover:bg-[#1e2128]/50 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-xl">settings</span>
            <span className="text-sm font-medium">Settings</span>
          </Link>

          <Link
            href="/dashboard/help"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              pathname === '/dashboard/help'
                ? 'bg-[#1e2128] text-white'
                : 'text-gray-400 hover:bg-[#1e2128]/50 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-xl">help</span>
            <span className="text-sm font-medium">Help</span>
          </Link>
        </nav>

        <div className="p-3 border-t border-[#1e2128] mt-auto">
          <SignedIn>
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="size-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                {user?.firstName?.[0]?.toUpperCase() || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-medium truncate text-white">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.username || user?.emailAddresses?.[0]?.emailAddress || 'User'}
                </p>
                <p className="text-xs text-gray-500">Free Plan</p>
              </div>
            </div>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors">
                <span className="material-symbols-outlined text-xl">login</span>
                <span className="text-sm font-medium">Sign In</span>
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
