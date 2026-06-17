export default function Loading() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-4">
        <div className="h-7 w-64 bg-surface-2 rounded-lg animate-pulse" />
        <div className="h-[420px] w-full bg-surface-2 rounded-xl animate-pulse" />
        <div className="h-4 w-48 bg-surface-2 rounded animate-pulse" />
      </div>
    </div>
  );
}
