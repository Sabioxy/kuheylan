import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import TrackCardSkeleton from "@/components/TrackCardSkeleton";

export default function ArtistLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link
        href="/market"
        className="inline-flex items-center gap-2 text-sm text-zinc-500"
      >
        <ArrowLeft className="h-4 w-4" /> Market'e Dön
      </Link>

      <header className="mt-8 overflow-hidden rounded-3xl border border-zinc-200/60 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/40">
        <div className="h-48 w-full animate-pulse bg-zinc-200 dark:bg-white/5" />
        <div className="px-8 pb-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
            <div className="-mt-16 h-32 w-32 shrink-0 animate-pulse rounded-3xl border-4 border-white bg-zinc-200 dark:border-zinc-900 dark:bg-white/5" />
            <div className="flex-1 space-y-3">
              <div className="h-10 w-48 animate-pulse rounded-md bg-zinc-200 dark:bg-white/5" />
              <div className="h-4 w-3/4 animate-pulse rounded-md bg-zinc-200 dark:bg-white/5" />
            </div>
          </div>
        </div>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-12">
        <main className="lg:col-span-8">
          <div className="h-8 w-48 animate-pulse rounded-md bg-zinc-200 dark:bg-white/5" />
          <div className="mt-6 grid gap-4">
            {[...Array(3)].map((_, i) => (
              <TrackCardSkeleton key={i} />
            ))}
          </div>
        </main>
        <aside className="lg:col-span-4">
          <div className="h-64 animate-pulse rounded-3xl bg-zinc-100 dark:bg-white/5" />
        </aside>
      </div>
    </div>
  );
}
