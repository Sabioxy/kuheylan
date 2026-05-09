"use client";

import { motion } from "framer-motion";

export default function TrackCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/40">
      <div className="flex items-start gap-4">
        {/* Thumbnail skeleton */}
        <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-zinc-200 dark:bg-white/5" />

        <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            {/* Title skeleton */}
            <div className="h-5 w-3/4 animate-pulse rounded-md bg-zinc-200 dark:bg-white/5" />
            {/* Artist skeleton */}
            <div className="h-4 w-1/2 animate-pulse rounded-md bg-zinc-200 dark:bg-white/5" />
            
            {/* Tags skeleton */}
            <div className="mt-3 flex gap-2">
              <div className="h-5 w-12 animate-pulse rounded-full bg-zinc-100 dark:bg-white/5" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-100 dark:bg-white/5" />
            </div>
          </div>

          <div className="shrink-0 space-y-2 text-right">
            {/* Price skeleton */}
            <div className="h-5 w-16 animate-pulse rounded-md bg-zinc-200 dark:bg-white/5" />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {/* Buttons skeleton */}
        <div className="h-9 animate-pulse rounded-full bg-zinc-100 dark:bg-white/5" />
        <div className="h-9 animate-pulse rounded-full bg-zinc-200 dark:bg-white/10" />
      </div>
    </div>
  );
}
