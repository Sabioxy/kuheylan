import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Music, Disc, Calendar, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import TrackCard, { type TrackCardModel } from "@/components/TrackCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const album = await prisma.album.findUnique({
    where: { id },
    select: { name: true, artist: { select: { name: true } } },
  });

  if (!album) return { title: "Albüm Bulunamadı" };

  return {
    title: `${album.name} - ${album.artist.name} | Küheylan`,
    description: `${album.artist.name} sanatçısının ${album.name} isimli albümü.`,
  };
}

export default async function AlbumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const album = await prisma.album.findUnique({
    where: { id },
    include: {
      artist: true,
      tracks: {
        where: { isAvailable: true },
        orderBy: { createdAt: "asc" }, // Albüm sırasına göre
      },
    },
  });

  if (!album) notFound();

  const user = await getCurrentUser();

  const ownedSet = new Set<string>();
  if (user && album.tracks.length > 0) {
    const owned = await prisma.userLibrary.findMany({
      where: { userId: user.id, trackId: { in: album.tracks.map(t => t.id) } },
      select: { trackId: true },
    });
    owned.forEach(o => ownedSet.add(o.trackId));
  }

  const tracks: TrackCardModel[] = album.tracks.map((t) => ({
    id: t.id,
    name: t.name,
    artistName: album.artist.name,
    bpm: t.bpm ?? undefined,
    genre: t.genre ?? undefined,
    basePriceCents: t.basePriceCents,
    effectivePriceCents: t.effectivePriceCents,
    isAvailable: t.isAvailable,
    imageUrl: t.coverImageUrl ?? album.coverUrl ?? undefined,
    audioUrl: ownedSet.has(t.id) ? t.cdnAudioUrl : (t.previewAudioUrl ?? t.cdnAudioUrl),
    artistId: album.artistId,
    isOwned: ownedSet.has(t.id),
  }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link
        href="/market"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft className="h-4 w-4" /> Market'e Dön
      </Link>

      <header className="mt-8 overflow-hidden rounded-3xl border border-zinc-200/60 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/40">
        <div className="flex flex-col md:flex-row">
          <div className="relative aspect-square w-full md:w-64 shrink-0 overflow-hidden bg-zinc-100 dark:bg-white/5">
            {album.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={album.coverUrl} alt={album.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                <Disc className="h-20 w-20 text-zinc-300 dark:text-zinc-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          <div className="flex flex-1 flex-col justify-end p-8">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Disc className="h-3.5 w-3.5" /> Albüm
            </div>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
              {album.name}
            </h1>
            
            <div className="mt-6 flex flex-wrap items-center gap-6">
              <Link href={`/artist/${album.artistId}`} className="flex items-center gap-2 group">
                <div className="h-6 w-6 overflow-hidden rounded-full border border-zinc-200 dark:border-white/10">
                   {album.artist.profileImageUrl ? (
                     // eslint-disable-next-line @next/next/no-img-element
                     <img src={album.artist.profileImageUrl} alt="" className="h-full w-full object-cover" />
                   ) : <div className="h-full w-full bg-zinc-200 dark:bg-zinc-800" />}
                </div>
                <span className="text-sm font-medium text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400 transition-colors">
                  {album.artist.name}
                </span>
              </Link>
              
              {album.releaseAt && (
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(album.releaseAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <Music className="h-4 w-4" />
                <span>{album.tracks.length} Parça</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-12">
        <div className="flex items-center justify-between border-b border-zinc-200/60 pb-4 dark:border-white/10">
          <h2 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">Albüm İçeriği</h2>
        </div>
        
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {tracks.length > 0 ? (
            tracks.map((t) => (
              <TrackCard key={t.id} track={t} canAddToLibrary={!!user} />
            ))
          ) : (
            <div className="col-span-full rounded-3xl border border-dashed border-zinc-200 p-12 text-center dark:border-white/10">
              <Music className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
              <p className="mt-4 text-zinc-500 dark:text-zinc-400">Bu albümde henüz bir parça bulunmuyor.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Info */}
      <footer className="mt-20 border-t border-zinc-200/60 pt-8 dark:border-white/10">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">Lisans Hakkında</h4>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Bu albümdeki parçaları satın aldığınızda, eserlerin ticari olmayan projelerinizde veya 
              kişisel dinleme amaçlı kullanımı için ömür boyu lisans sahibi olursunuz.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">Sanatçıya Destek</h4>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Küheylan üzerinden yaptığınız her satın alma işleminin %90'ından fazlası doğrudan 
              {album.artist.name} isimli sanatçıya aktarılmaktadır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
