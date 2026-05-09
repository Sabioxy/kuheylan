import TrackCardSkeleton from "@/components/TrackCardSkeleton";

export default function MarketLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-col gap-2">
        <div className="h-8 w-32 animate-pulse rounded-md bg-zinc-200 dark:bg-white/5" />
        <div className="h-4 w-64 animate-pulse rounded-md bg-zinc-200 dark:bg-white/5" />
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="h-64 animate-pulse rounded-3xl border border-zinc-200/60 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/40" />
        </aside>

        <section className="lg:col-span-9">
          <div className="rounded-3xl border border-zinc-200/60 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="h-5 w-20 animate-pulse rounded-md bg-zinc-200 dark:bg-white/5" />
              <div className="flex items-center gap-2">
                <div className="h-7 w-24 animate-pulse rounded-full bg-zinc-200 dark:bg-white/5" />
                <div className="h-7 w-24 animate-pulse rounded-full bg-zinc-200 dark:bg-white/5" />
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <TrackCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
