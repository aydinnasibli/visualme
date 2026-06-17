export default function Loading() {
  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="h-8 w-56 bg-surface-2 rounded-lg animate-pulse" />
        <div className="h-4 w-40 bg-surface-2 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-surface-2 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
