"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TrackCard, { type TrackCardModel } from "./TrackCard";

interface SponsoredCarouselProps {
  tracks: TrackCardModel[];
  user: any;
}

export default function SponsoredCarousel({ tracks, user }: SponsoredCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % tracks.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  };

  useEffect(() => {
    timerRef.current = setInterval(next, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tracks.length]);

  if (tracks.length === 0) return null;

  return (
    <div className="relative group">
      <div className="overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={tracks[currentIndex].id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <TrackCard track={tracks[currentIndex]} canAddToLibrary={Boolean(user)} />
          </motion.div>
        </AnimatePresence>
      </div>

      {tracks.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prev(); }}
            className="absolute -left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm opacity-0 transition-opacity group-hover:opacity-100 dark:border-white/10 dark:bg-zinc-900"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next(); }}
            className="absolute -right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm opacity-0 transition-opacity group-hover:opacity-100 dark:border-white/10 dark:bg-zinc-900"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          
          <div className="mt-4 flex justify-center gap-1.5">
            {tracks.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex ? "w-4 bg-zinc-950 dark:bg-white" : "w-1.5 bg-zinc-300 dark:bg-zinc-700"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
