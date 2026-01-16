'use client';

import { useUser, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex overflow-hidden bg-[#0f1419]">
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
