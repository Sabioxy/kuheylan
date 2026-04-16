"use client";

import { motion } from "framer-motion";
import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";

import { usePlayer } from "@/components/PlayerProvider";

export default function StickyPlayer() {
  const { nowPlaying, isPlaying, toggle } = usePlayer();

  const title = nowPlaying?.title ?? "Şu an çalan yok";
  const subtitle = nowPlaying?.subtitle ?? "Bir şarkı seç";
  const canControl = Boolean(nowPlaying?.audioUrl);

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200/60 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-zinc-950/40"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">{title}</div>
          <div className="truncate text-xs text-zinc-600 dark:text-zinc-300">{subtitle}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            className="inline-flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border border-zinc-200/70 bg-white text-zinc-900 opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50"
            aria-label="Geri"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            type="button"
            disabled={!canControl}
            onClick={toggle}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
            aria-label={isPlaying ? "Duraklat" : "Oynat"}
            title={canControl ? undefined : "Önizleme yok"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          <button
            type="button"
            disabled
            className="inline-flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border border-zinc-200/70 bg-white text-zinc-900 opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50"
            aria-label="İleri"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          <div className="ml-2 hidden items-center gap-2 sm:flex">
            <Volume2 className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
              <div
                className={
                  "h-full rounded-full bg-zinc-950 transition-all dark:bg-white " +
                  (isPlaying ? "w-2/3" : "w-1/6")
                }
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
