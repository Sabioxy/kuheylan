"use client";

import { Play, Plus } from "lucide-react";
import { usePlayer } from "@/components/PlayerProvider";
import { useSyncExternalStore } from "react";
import { readCart, subscribeCart, addToCart, EMPTY_CART } from "@/lib/cart";
import { useRouter } from "next/navigation";

interface TrackDetailActionsProps {
  trackId: string;
  trackName: string;
  artistName: string;
  audioUrl: string;
  isOwned: boolean;
  isAvailable: boolean;
  canAddToCart: boolean;
}

export default function TrackDetailActions({
  trackId,
  trackName,
  artistName,
  audioUrl,
  isOwned,
  isAvailable,
  canAddToCart,
}: TrackDetailActionsProps) {
  const player = usePlayer();
  const router = useRouter();
  const cart = useSyncExternalStore(subscribeCart, readCart, () => EMPTY_CART);
  const inCart = cart?.includes(trackId);

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => {
          player.play({
            id: trackId,
            title: trackName,
            subtitle: artistName,
            audioUrl: audioUrl,
          });
        }}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-8 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:bg-white/10"
      >
        <Play className="h-5 w-5" /> Dinle
      </button>
      <button
        disabled={!isAvailable || !canAddToCart}
        onClick={() => {
          if (inCart) {
            router.push("/cart");
            return;
          }
          addToCart(trackId);
        }}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-zinc-950 px-8 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="h-5 w-5" />{" "}
        {inCart ? (isOwned ? "Sepette (Hediye)" : "Sepette (Git)") : isOwned ? "Hediye Olarak Ekle" : "Sepete Ekle"}
      </button>
    </div>
  );
}
