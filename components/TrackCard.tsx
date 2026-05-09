"use client";

import { motion } from "framer-motion";
import { BadgePercent, Heart, Play, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useState } from "react";

import { usePlayer } from "@/components/PlayerProvider";
import { readCart, subscribeCart, addToCart, removeFromCart, EMPTY_CART } from "@/lib/cart";

export type TrackCardModel = {
  id: string;
  name: string;
  artistName: string;
  bpm?: number;
  genre?: string;
  basePriceCents: number;
  effectivePriceCents: number;
  isSponsored?: boolean;
  isAvailable?: boolean;

  // Optional cover image (placeholder for future DB field)
  imageUrl?: string;

  // Guest can listen to previews.
  audioUrl?: string;
  artistId?: string;
};

type TrackCardProps = {
  track: TrackCardModel;
  onPlay?: (trackId: string) => void;
  onAddToLibrary?: (trackId: string) => void;
  canAddToLibrary?: boolean;
  showAddToLibrary?: boolean;
  isOwned?: boolean;
};

function formatTRYFromCents(cents: number) {
  const value = cents / 100;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(value);
}

const FAVORITES_KEY = "kuheylan:favorites";
const FAVORITES_EVENT = "kuheylan:favorites:changed";

const EMPTY_FAVORITES: string[] = [];
let cachedFavoritesRaw: string | null = null;
let cachedFavorites: string[] = EMPTY_FAVORITES;

function readFavorites(): string[] {
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

function writeFavorites(ids: string[]) {
  if (typeof window === "undefined") return;

  try {
    const raw = JSON.stringify(ids);
    localStorage.setItem(FAVORITES_KEY, raw);

    cachedFavoritesRaw = raw;
    cachedFavorites = ids;

    window.dispatchEvent(new Event(FAVORITES_EVENT));
  } catch {
    // ignore (storage disabled)
  }
}

function subscribeFavorites(onStoreChange: () => void) {
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

export default function TrackCard({
  track,
  onPlay,
  onAddToLibrary,
  canAddToLibrary = false,
  showAddToLibrary = true,
  isOwned,
}: TrackCardProps) {
  const router = useRouter();
  const player = usePlayer();
  const hasDiscount = track.effectivePriceCents < track.basePriceCents;
  const isAvailable = track.isAvailable ?? true;
  const addLocked = !canAddToLibrary;
  const [owned] = useState(Boolean(isOwned));

  const favorites = useSyncExternalStore(subscribeFavorites, readFavorites, () => EMPTY_FAVORITES);
  const isFavorite = favorites?.includes(track.id);

  const cart = useSyncExternalStore(subscribeCart, readCart, () => EMPTY_CART);
  const inCart = cart?.includes(track.id);

  return (
    <motion.article
      whileHover={{ y: -2, scale: 1.015 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={
        "group relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/70 p-4 shadow-sm backdrop-blur " +
        "dark:border-white/10 dark:bg-zinc-900/40"
      }
    >
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          const currentFavorites = favorites || [];
          const next = isFavorite
            ? currentFavorites.filter((id) => id !== track.id)
            : [...currentFavorites, track.id];
          writeFavorites(next);
        }}
        aria-pressed={isFavorite}
        className={
          "absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-colors " +
          (isFavorite
            ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-200/10 dark:bg-rose-500/10 dark:text-rose-200"
            : "border-zinc-200/60 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10")
        }
        title={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
      >
        <Heart className={"h-4 w-4 " + (isFavorite ? "fill-current" : "")} />
      </motion.button>

      <div className="flex items-start gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-zinc-200/60 bg-zinc-100 dark:border-white/10 dark:bg-white/5">
          {track.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,rgba(24,24,27,0.15),transparent_55%)] dark:bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.14),transparent_55%)]" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {track.isSponsored ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/60 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:border-amber-200/10 dark:bg-amber-500/10 dark:text-amber-200">
                  <Sparkles className="h-3.5 w-3.5" /> Sponsorlu
                </span>
              ) : null}

              {!isAvailable ? (
                <span className="inline-flex items-center rounded-full border border-zinc-200/70 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                  Satış kapalı
                </span>
              ) : null}
            </div>

            <Link href={`/track/${track.id}`}>
              <h3 className="mt-2 truncate text-lg font-semibold tracking-tight text-zinc-950 transition-colors hover:text-indigo-600 dark:text-zinc-50 dark:hover:text-indigo-400">
                {track.name}
              </h3>
            </Link>
            {track.artistId ? (
              <Link href={`/artist/${track.artistId}`}>
                <p className="mt-1 truncate text-sm text-zinc-600 transition-colors hover:text-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400">
                  {track.artistName}
                </p>
              </Link>
            ) : (
              <p className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-300">{track.artistName}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
              {typeof track.bpm === "number" ? (
                <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-white/5">{track.bpm} BPM</span>
              ) : null}
              {track.genre ? (
                <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-white/5">{track.genre}</span>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 text-right">
            {hasDiscount ? (
              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                <BadgePercent className="h-3.5 w-3.5" /> İndirim
              </div>
            ) : null}

            <div className="mt-3">
              {hasDiscount ? (
                <div className="text-xs text-zinc-500 line-through dark:text-zinc-400">
                  {formatTRYFromCents(track.basePriceCents)}
                </div>
              ) : null}
              <div className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                {formatTRYFromCents(track.effectivePriceCents)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <motion.button
          type="button"
          disabled={!track.audioUrl}
          onClick={() => {
            if (onPlay) {
              onPlay(track.id);
              return;
            }
            if (!track.audioUrl) return;
            player.play({
              id: track.id,
              title: track.name,
              subtitle: track.artistName,
              audioUrl: track.audioUrl,
            });
          }}
          className="inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-full border border-zinc-200/70 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:bg-white/10"
          title={track.audioUrl ? undefined : "Önizleme yok"}
        >
          <Play className="h-4 w-4 shrink-0" />
          <span className="min-w-0 truncate">Dinle</span>
        </motion.button>

        {showAddToLibrary ? (
          <motion.button
            type="button"
            disabled={!isAvailable || addLocked}
            aria-disabled={!isAvailable || addLocked}
            onClick={() => {
              if (!isAvailable || addLocked) return;
              if (inCart) {
                router.push("/cart");
                return;
              }
              addToCart(track.id);
            }}
            className={
              "inline-flex w-full min-w-0 cursor-pointer items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium shadow-sm transition-colors " +
              (inCart 
                ? "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 "
                : "bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 ") +
              "disabled:cursor-not-allowed disabled:opacity-50"
            }
            title={
              addLocked
                ? "Misafir modunda sepete eklenmez"
                : !isAvailable
                  ? "Satış kapalı"
                  : owned
                    ? (inCart ? "Sepette (Hediye)" : "Hediye İçin Sepete Ekle")
                    : (inCart ? "Sepette - Sepete Git" : "Sepete Ekle")
            }
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate sm:hidden">{owned ? (inCart ? "Sepette" : "Hediye") : inCart ? "Sepette" : "Ekle"}</span>
            <span className="hidden min-w-0 truncate sm:inline">{owned ? (inCart ? "Sepette (Hediye)" : "Hediye İçin Ekle") : inCart ? "Sepette (Git)" : "Sepete Ekle"}</span>
          </motion.button>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="absolute -left-24 -top-24 h-48 w-48 rounded-full bg-zinc-950/5 blur-2xl dark:bg-white/5" />
      </div>
    </motion.article>
  );
}
