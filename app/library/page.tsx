import Link from "next/link";
import { redirect } from "next/navigation";

import type { TrackCardModel } from "@/components/TrackCard";

import TrackCard from "@/components/TrackCard";
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
    audioUrl: t.cdnAudioUrl,
    artistId: t.artist.id,
  };
}

export const metadata = {
  title: "Kütüphanem - Küheylan",
  description: "Satın aldığın tüm müzik lisansları burada güvende.",
};

export default async function LibraryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rows = await prisma.userLibrary.findMany({
    where: { userId: user.id },
    include: {
      track: {
        include: { artist: { select: { id: true, name: true } } },
      },
    },
    orderBy: { purchasedAt: "desc" },
    take: 60,
  });

  const items = rows.map((r) => toCardModel(r.track));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Kütüphane</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Satın aldıkların burada kalıcı.</p>
      </header>

      <div className="mt-8">
        {items.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
            {items.map((t) => (
              <TrackCard key={t.id} track={t} showAddToLibrary={false} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-zinc-200/60 bg-white/70 p-6 text-sm text-zinc-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
            Henüz satın alma yok. <Link className="underline underline-offset-4" href="/market">Satış yerine git</Link>.
          </div>
        )}
      </div>
    </div>
  );
}
