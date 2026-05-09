import type { TrackCardModel } from "@/components/TrackCard";

import HomeFavoritesSection from "@/components/HomeFavoritesSection";
import { getCurrentUser } from "@/lib/current-user";
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
  artist: { id: string, name: string };
}, opts: { isOwned: boolean }): TrackCardModel {
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
    audioUrl: opts.isOwned ? t.cdnAudioUrl : (t.previewAudioUrl ?? t.cdnAudioUrl),
    artistId: t.artist.id,
  };
}

export const metadata = {
  title: "Favorilerim - Küheylan",
  description: "Beğendiğin tüm müzikler tek bir yerde.",
};

export default async function FavoritesPage() {
  const user = await getCurrentUser();

  const fallbackRaw = await prisma.track.findMany({
    include: { artist: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const ownedSet = new Set<string>();
  if (user && fallbackRaw.length) {
    const owned = await prisma.userLibrary.findMany({
      where: { userId: user.id, trackId: { in: fallbackRaw.map((t) => t.id) } },
      select: { trackId: true },
    });
    for (const row of owned) ownedSet.add(row.trackId);
  }

  const fallback = fallbackRaw.map((t) => toCardModel(t, { isOwned: ownedSet.has(t.id) }));

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
