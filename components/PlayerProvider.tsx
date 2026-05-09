"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

function normalizeMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  if (
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  if (trimmed.startsWith("public/")) {
    return "/" + trimmed.slice("public/".length);
  }

  return "/" + trimmed;
}

export type NowPlaying = {
  id: string;
  title: string;
  subtitle?: string;
  audioUrl?: string;
};

type PlayerContextValue = {
  nowPlaying: NowPlaying | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  play: (t: NowPlaying) => void;
  pause: () => void;
  toggle: () => void;
  seekTo: (seconds: number) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const play = useCallback((t: NowPlaying) => {
    const src = t.audioUrl ? normalizeMediaUrl(t.audioUrl) : undefined;
    
    // Reset UI state immediately
    setCurrentTime(0);
    setDuration(0);
    setNowPlaying({ ...t, audioUrl: src });

    const audio = audioRef.current;
    if (!audio || !src) return;

    audio.src = src;
    audio.currentTime = 0;
    audio.load();

    const p = audio.play();
    if (p) p.catch(() => setIsPlaying(false));
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
    if (p) p.catch(() => setIsPlaying(false));
    setIsPlaying(true);
  }, [isPlaying, nowPlaying?.audioUrl]);

  const seekTo = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const safeDuration = Number.isFinite(audio.duration) ? audio.duration : duration;
    const clamped = Math.min(Math.max(seconds, 0), safeDuration || seconds);
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }, [duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onLoadedMetadata = () => {
      const next = Number.isFinite(audio.duration) ? audio.duration : 0;
      setDuration(next);
      if (audio.currentTime === 0) setCurrentTime(0);
    };
    const onDurationChange = () => {
      const next = Number.isFinite(audio.duration) ? audio.duration : 0;
      setDuration(next);
    };

    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onDurationChange);

    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onDurationChange);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!nowPlaying?.audioUrl) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
  }, [nowPlaying?.audioUrl]);

  const value = useMemo<PlayerContextValue>(
    () => ({ nowPlaying, isPlaying, currentTime, duration, play, pause, toggle, seekTo }),
    [nowPlaying, isPlaying, currentTime, duration, play, pause, toggle, seekTo],
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
