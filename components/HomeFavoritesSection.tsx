"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import TrackCard, { type TrackCardModel } from "@/components/TrackCard";

const FAVORITES_KEY = "kuheylan:favorites";
const FAVORITES_EVENT = "kuheylan:favorites:changed";

const EMPTY_FAVORITES: string[] = [];
let cachedFavoritesRaw: string | null = null;
let cachedFavorites: string[] = EMPTY_FAVORITES;

function readFavoriteIds(): string[] {
  if (typeof window === "undefined") return EMPTY_FAVORITES;

  let raw: string | null;
  try {
    raw = localStorage.getItem(FAVORITES_KEY);
  } catch {
    return cachedFavorites;
  }

  if (raw === cachedFavoritesRaw) return cachedFavorites;
  cachedFavoritesRaw = raw;

  if (!raw) {
    cachedFavorites = EMPTY_FAVORITES;
    return cachedFavorites;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cachedFavorites = EMPTY_FAVORITES;
      return cachedFavorites;
    }

    cachedFavorites = parsed.filter((x): x is string => typeof x === "string");
    return cachedFavorites;
  } catch {
    cachedFavorites = EMPTY_FAVORITES;
    return cachedFavorites;
  }
}

function subscribeFavoriteIds(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const onStorage = (e: StorageEvent) => {
    if (e.key === FAVORITES_KEY) onStoreChange();
  };

  const onCustom: EventListener = () => {
    onStoreChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(FAVORITES_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(FAVORITES_EVENT, onCustom);
  };
}

async function fetchFavoriteTracks(ids: string[], signal: AbortSignal) {
  let res: Response;
  try {
    res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
      signal,
    });
  } catch (err) {
    const name =
      typeof err === "object" && err !== null && "name" in err
        ? String((err as { name?: unknown }).name)
        : "";

    if ((err instanceof DOMException && err.name === "AbortError") || name === "AbortError") {
      return null;
    }

    throw err;
  }

  if (!res.ok) return null;

  let json: unknown;
  try {
    json = await res.json();
  } catch (err) {
    const name =
      typeof err === "object" && err !== null && "name" in err
        ? String((err as { name?: unknown }).name)
        : "";

    if ((err instanceof DOMException && err.name === "AbortError") || name === "AbortError") {
      return null;
    }

    return null;
  }

  if (!json || typeof json !== "object") return null;

  const tracks = (json as { tracks?: unknown }).tracks;
  if (!Array.isArray(tracks)) return null;

  return tracks as TrackCardModel[];
}

type Props = {
  fallback: TrackCardModel[];
  title?: string;
  subtitleWhenUsingLocal?: string;
  subtitleWhenFallback?: string;
};

export default function HomeFavoritesSection({
  fallback,
  title = "Favoriler",
  subtitleWhenUsingLocal = "Senin favoriye eklediklerin.",
  subtitleWhenFallback = "Fiyatı düşük öne çıkanlar.",
}: Props) {
  const favoriteIds = useSyncExternalStore(
    subscribeFavoriteIds,
    readFavoriteIds,
    () => EMPTY_FAVORITES,
  );

  const idsKey = useMemo(() => favoriteIds.join(","), [favoriteIds]);

  const [tracks, setTracks] = useState<TrackCardModel[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (favoriteIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTracks(null);
      setLoading(false);
      return;
    }

    const ac = new AbortController();
    setLoading(true);

    fetchFavoriteTracks(favoriteIds, ac.signal)
      .then((t) => {
        if (!ac.signal.aborted) setTracks(t);
      })
      .catch((err) => {
        if (ac.signal.aborted) return;

        const name =
          typeof err === "object" && err !== null && "name" in err
            ? String((err as { name?: unknown }).name)
            : "";

        if ((err instanceof DOMException && err.name === "AbortError") || name === "AbortError") {
          return;
        }

        setTracks(null);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => {
      ac.abort();
    };
  }, [idsKey, favoriteIds]);

  const hasLocalIds = favoriteIds.length > 0;
  const shown = hasLocalIds && tracks && tracks.length > 0 ? tracks : fallback;
  const usingLocalFavorites = hasLocalIds && !!tracks && tracks.length > 0;

  return (
    <section>
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          {usingLocalFavorites ? subtitleWhenUsingLocal : subtitleWhenFallback}
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {favoriteIds.length > 0 && loading ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-300">Favoriler yükleniyor…</div>
        ) : null}

        {shown.map((t) => (
          <TrackCard key={t.id} track={t} canAddToLibrary={true} />
        ))}
      </div>
    </section>
  );
}
