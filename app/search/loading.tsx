import TrackCardSkeleton from "@/components/TrackCardSkeleton";

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8">
        <div className="h-8 w-64 animate-pulse rounded-md bg-zinc-200 dark:bg-white/5" />
        <div className="mt-2 h-4 w-96 animate-pulse rounded-md bg-zinc-200 dark:bg-white/5" />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        {[...Array(6)].map((_, i) => (
          <TrackCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
