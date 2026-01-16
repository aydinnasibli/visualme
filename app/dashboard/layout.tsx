'use client';

import HistorySidebar from '@/components/dashboard/HistorySidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex overflow-hidden bg-[#0f1419]">
      {/* History Sidebar */}
      <HistorySidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
