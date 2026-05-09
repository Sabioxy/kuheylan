import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TrackCard, { type TrackCardModel } from "@/components/TrackCard";
import { getCurrentUser } from "@/lib/current-user";
import Link from "next/link";
import { Search as SearchIcon, TrendingUp, Music } from "lucide-react";

export const metadata = {
  title: "Arama Sonuçları - Küheylan",
  description: "Küheylan üzerindeki binlerce müzik eseri arasından dilediğini ara.",
};

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
    include: { artist: { select: { id: true, name: true } } },
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
    artistId: t.artist.id,
  }));

  const popularSearches = ["Techno", "House", "Lo-fi", "Ambient", "Cinematic"];

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
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 p-12 text-center dark:border-white/10">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-white/5">
            <SearchIcon className="h-8 w-8 text-zinc-400" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Sonuç Bulunamadı</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Aradığınız kriterlere uygun parça veya sanatçı bulamadık.</p>
          
          <div className="mt-8">
            <h3 className="flex items-center justify-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              <TrendingUp className="h-4 w-4 text-indigo-500" /> Popüler Aramalar
            </h3>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {popularSearches.map((s) => (
                <Link
                  key={s}
                  href={`/search?q=${s}`}
                  className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>
          
          <Link href="/market" className="mt-10 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100">
            <Music className="h-4 w-4" /> Tüm Marketi Gör
          </Link>
        </div>
      )}
    </div>
  );
}
