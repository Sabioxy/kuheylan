"use client";

import { motion } from "framer-motion";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useState } from "react";

import { usePlayer } from "@/components/PlayerProvider";

function formatTime(totalSeconds: number) {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function StickyPlayer() {
  const { nowPlaying, isPlaying, toggle, currentTime, duration, seekTo } = usePlayer();
  const [scrub, setScrub] = useState<{ trackId: string | null; value: number } | null>(null);

  const title = nowPlaying?.title ?? "Şu an çalan yok";
  const subtitle = nowPlaying?.subtitle ?? "Bir şarkı seç";
  const canControl = Boolean(nowPlaying?.audioUrl);

  const trackId = nowPlaying?.id ?? null;
  const sliderValue = scrub?.trackId === trackId ? scrub.value : currentTime;
  const max = duration > 0 ? duration : 0;

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200/60 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-zinc-950/40"
    >
      <div className="mx-auto max-w-6xl px-6 py-3">
        <div className="flex items-center justify-between gap-4">
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
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <div className="w-10 text-[11px] tabular-nums text-zinc-600 dark:text-zinc-300">
            {formatTime(sliderValue)}
          </div>

          <input
            type="range"
            min={0}
            max={max}
            step={0.25}
            value={Math.min(sliderValue, max || sliderValue)}
            disabled={!canControl || max === 0}
            onChange={(e) => {
              const next = Number(e.target.value);
              setScrub({ trackId, value: next });
              seekTo(next);
            }}
            onPointerUp={() => setScrub(null)}
            className="h-2 w-full cursor-pointer accent-zinc-950 disabled:cursor-not-allowed disabled:opacity-60 dark:accent-white"
            aria-label="İlerlet"
          />

          <div className="w-10 text-right text-[11px] tabular-nums text-zinc-600 dark:text-zinc-300">
            {formatTime(duration)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
