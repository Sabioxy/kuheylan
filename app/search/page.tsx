import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TrackCard, { type TrackCardModel } from "@/components/TrackCard";
import { getCurrentUser } from "@/lib/current-user";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  if (!query) {
    redirect("/market");
  }

  const user = await getCurrentUser();

  const tracksRaw = await prisma.track.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { artist: { name: { contains: query } } },
        { album: { name: { contains: query } } },
      ],
      isAvailable: true,
    },
    include: { artist: { select: { name: true } } },
    take: 50,
  });

  let ownedSet = new Set<string>();
  if (user && tracksRaw.length > 0) {
    const owned = await prisma.userLibrary.findMany({
      where: { userId: user.id, trackId: { in: tracksRaw.map(t => t.id) } },
      select: { trackId: true },
    });
    ownedSet = new Set(owned.map(o => o.trackId));
  }

  const tracks: TrackCardModel[] = tracksRaw.map((t) => ({
    id: t.id,
    name: t.name,
    artistName: t.artist.name,
    bpm: t.bpm ?? undefined,
    genre: t.genre ?? undefined,
    basePriceCents: t.basePriceCents,
    effectivePriceCents: t.effectivePriceCents,
    isAvailable: t.isAvailable,
    imageUrl: t.coverImageUrl ?? undefined,
    audioUrl: ownedSet.has(t.id) ? t.cdnAudioUrl : (t.previewAudioUrl ?? t.cdnAudioUrl),
  }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Arama Sonuçları: &quot;{query}&quot;
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Şarkı, sanatçı veya albüm adında eşleşen {tracks.length} sonuç bulundu.
        </p>
      </header>

      {tracks.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          {tracks.map((t) => (
            <TrackCard key={t.id} track={t} canAddToLibrary={Boolean(user)} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-zinc-200/60 bg-white/70 p-8 text-center shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/40">
          <p className="text-zinc-600 dark:text-zinc-400">Aradığınız kritere uygun sonuç bulunamadı.</p>
          <Link href="/market" className="mt-4 inline-block rounded-full bg-zinc-950 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100">
            Market'e Geri Dön
          </Link>
        </div>
      )}
    </div>
  );
}
