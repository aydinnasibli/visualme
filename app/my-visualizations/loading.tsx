export default function Loading() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-surface-2 rounded-lg animate-pulse" />
          <div className="h-9 w-36 bg-surface-2 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 flex-1 max-w-sm bg-surface-2 rounded-lg animate-pulse" />
          <div className="h-10 w-10 bg-surface-2 rounded-lg animate-pulse" />
          <div className="h-10 w-10 bg-surface-2 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 bg-surface-2 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
