import type { TrackCardModel } from "@/components/TrackCard";

import HomeFavoritesSection from "@/components/HomeFavoritesSection";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toCardModel(t: {
  id: string;
  name: string;
  bpm: number | null;
  genre: string | null;
  basePriceCents: number;
  effectivePriceCents: number;
  isAvailable: boolean;
  coverImageUrl: string | null;
  cdnAudioUrl: string;
  previewAudioUrl: string | null;
  artist: { name: string };
}): TrackCardModel {
  return {
    id: t.id,
    name: t.name,
    artistName: t.artist.name,
    bpm: t.bpm ?? undefined,
    genre: t.genre ?? undefined,
    basePriceCents: t.basePriceCents,
    effectivePriceCents: t.effectivePriceCents,
    isAvailable: t.isAvailable,
    imageUrl: t.coverImageUrl ?? undefined,
    audioUrl: t.previewAudioUrl ?? t.cdnAudioUrl,
  };
}

export default async function FavoritesPage() {
  const fallbackRaw = await prisma.track.findMany({
    include: { artist: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const fallback = fallbackRaw.map(toCardModel);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Favoriler
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Kalp ile kaydettiklerin burada.
        </p>
      </header>

      <div className="mt-8">
        <HomeFavoritesSection
          title="Favorilerim"
          subtitleWhenUsingLocal="Kaydettiklerin."
          subtitleWhenFallback="Henüz favorin yok. Bunlara göz atabilirsin."
          fallback={fallback}
        />
      </div>
    </div>
  );
}
