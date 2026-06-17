export default function Loading() {
  return (
    <div className="flex h-screen bg-surface">
      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-56 bg-surface-2 rounded-lg animate-pulse" />
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-surface-2 rounded-lg animate-pulse" />
            <div className="h-9 w-24 bg-surface-2 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 bg-surface-2 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
