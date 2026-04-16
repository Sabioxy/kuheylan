"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type NowPlaying = {
  id: string;
  title: string;
  subtitle?: string;
  audioUrl?: string;
};

type PlayerContextValue = {
  nowPlaying: NowPlaying | null;
  isPlaying: boolean;
  play: (t: NowPlaying) => void;
  pause: () => void;
  toggle: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback((t: NowPlaying) => {
    setNowPlaying(t);

    const audio = audioRef.current;
    if (!audio || !t.audioUrl) return;

    audio.src = t.audioUrl;
    audio.currentTime = 0;
    audio.load();

    const p = audio.play();
    if (p) {
      p.catch(() => setIsPlaying(false));
    }
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    if (!nowPlaying?.audioUrl) return;

    const p = audio.play();
    if (p) {
      p.catch(() => setIsPlaying(false));
    }
    setIsPlaying(true);
  }, [isPlaying, nowPlaying?.audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const url = nowPlaying?.audioUrl;
    if (!url) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      return;
    }

    audio.src = url;
    audio.load();
  }, [nowPlaying?.audioUrl]);

  const value = useMemo<PlayerContextValue>(
    () => ({ nowPlaying, isPlaying, play, pause, toggle }),
    [nowPlaying, isPlaying, play, pause, toggle],
  );

  return (
    <PlayerContext.Provider value={value}>
      <audio ref={audioRef} preload="none" />
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return ctx;
}
