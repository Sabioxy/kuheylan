import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TrackLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link
        href="/market"
        className="inline-flex items-center gap-2 text-sm text-zinc-500"
      >
        <ArrowLeft className="h-4 w-4" /> Market'e Dön
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="aspect-square animate-pulse rounded-3xl bg-zinc-200 dark:bg-white/5" />
        </div>

        <div className="lg:col-span-7">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-10 w-3/4 animate-pulse rounded-md bg-zinc-200 dark:bg-white/5" />
              <div className="h-6 w-1/3 animate-pulse rounded-md bg-zinc-200 dark:bg-white/5" />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-100 dark:bg-white/5" />
              ))}
            </div>

            <div className="h-48 animate-pulse rounded-3xl bg-zinc-100 dark:bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
