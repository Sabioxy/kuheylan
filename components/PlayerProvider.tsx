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
  next: () => void;
  previous: () => void;
  hasPlaylist: boolean;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playlist, setPlaylist] = useState<NowPlaying[]>([]);

  useEffect(() => {
    // Load library as initial playlist
    const fetchLibrary = async () => {
      try {
        const res = await fetch("/api/library");
        const data = await res.json();
        if (data.tracks) {
          setPlaylist(data.tracks);
        }
      } catch (error) {
        console.error("Failed to fetch library for playlist:", error);
      }
    };
    fetchLibrary();
  }, []);

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

  const next = useCallback(() => {
    if (playlist.length === 0) return;
    const currentIndex = nowPlaying ? playlist.findIndex(t => t.id === nowPlaying.id) : -1;
    const nextIndex = (currentIndex + 1) % playlist.length;
    play(playlist[nextIndex]);
  }, [nowPlaying, playlist, play]);

  const previous = useCallback(() => {
    if (playlist.length === 0) return;
    const currentIndex = nowPlaying ? playlist.findIndex(t => t.id === nowPlaying.id) : -1;
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    play(playlist[prevIndex]);
  }, [nowPlaying, playlist, play]);

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

    const onEnded = () => {
      setIsPlaying(false);
      next();
    };
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
  }, [next]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!nowPlaying?.audioUrl) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
  }, [nowPlaying?.audioUrl]);

  const hasPlaylist = playlist.length > 0;

  const value = useMemo<PlayerContextValue>(
    () => ({ nowPlaying, isPlaying, currentTime, duration, play, pause, toggle, seekTo, next, previous, hasPlaylist }),
    [nowPlaying, isPlaying, currentTime, duration, play, pause, toggle, seekTo, next, previous, hasPlaylist],
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
