export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex overflow-hidden bg-zinc-950">
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
