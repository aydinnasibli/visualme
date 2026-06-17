export default function Loading() {
  return (
    <div className="flex h-screen bg-surface">
      {/* Left panel skeleton */}
      <div className="w-full lg:w-[420px] border-r border-edge p-6 space-y-4">
        <div className="h-8 w-48 bg-surface-2 rounded-lg animate-pulse" />
        <div className="h-10 w-full bg-surface-2 rounded-lg animate-pulse" />
        <div className="space-y-3 mt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 w-full bg-surface-2 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
      {/* Right panel skeleton */}
      <div className="hidden lg:flex flex-1 items-center justify-center">
        <div className="w-[480px] space-y-4">
          <div className="h-6 w-64 bg-surface-2 rounded-lg animate-pulse mx-auto" />
          <div className="h-[320px] w-full bg-surface-2 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
