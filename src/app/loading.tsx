export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
        <span className="text-sm text-zinc-500">Loading…</span>
      </div>
    </div>
  );
}