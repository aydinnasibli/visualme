'use client';

import { Suspense } from 'react';
import HistorySidebar from '@/components/dashboard/HistorySidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex overflow-hidden bg-[#0f1419]">
      {/* History Sidebar */}
      <Suspense fallback={<div className="w-64 h-full bg-[#0a0d11] border-r border-[#1e2128]" />}>
        <HistorySidebar />
      </Suspense>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
