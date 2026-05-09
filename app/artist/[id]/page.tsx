import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Music, Users, Calendar, Mail } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import TrackCard, { type TrackCardModel } from "@/components/TrackCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const artist = await prisma.artist.findUnique({
    where: { id: params.id },
    select: { name: true, bio: true },
  });

  if (!artist) return { title: "Sanatçı Bulunamadı" };

  return {
    title: `${artist.name} - Sanatçı Profili | Küheylan`,
    description: artist.bio || `${artist.name} isimli sanatçının Küheylan üzerindeki tüm eserleri ve biyografisi.`,
  };
}

export default async function ArtistDetailPage({ params }: { params: { id: string } }) {
  const artist = await prisma.artist.findUnique({
    where: { id: params.id },
    include: {
      tracks: {
        where: { isAvailable: true },
        include: { artist: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { tracks: true, albums: true },
      },
    },
  });

  if (!artist) notFound();

  const user = await getCurrentUser();
  
  const tracks: TrackCardModel[] = artist.tracks.map((t) => ({
    id: t.id,
    name: t.name,
    artistName: artist.name,
    bpm: t.bpm ?? undefined,
    genre: t.genre ?? undefined,
    basePriceCents: t.basePriceCents,
    effectivePriceCents: t.effectivePriceCents,
    isAvailable: t.isAvailable,
    imageUrl: t.coverImageUrl ?? undefined,
    audioUrl: t.previewAudioUrl ?? t.cdnAudioUrl,
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
        <div className="relative h-48 w-full bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent)]" />
        </div>
        
        <div className="relative px-8 pb-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
            <div className="-mt-16 h-32 w-32 shrink-0 overflow-hidden rounded-3xl border-4 border-white bg-zinc-100 shadow-xl dark:border-zinc-900 dark:bg-white/5">
              {artist.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={artist.profileImageUrl} alt={artist.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                  <Users className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {artist.name}
                </h1>
                {artist.status === "PREMIUM" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    PREMIUM SANATÇI
                  </span>
                )}
              </div>
              <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
                {artist.bio || "Bu sanatçı henüz bir biyografi eklememiş."}
              </p>
            </div>
            
            <div className="flex gap-4 sm:flex-col sm:items-end sm:gap-1">
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                <span className="text-zinc-950 dark:text-zinc-50">{artist._count.tracks}</span> Eser
              </div>
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                <span className="text-zinc-950 dark:text-zinc-50">{artist._count.albums}</span> Albüm
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-12">
        <main className="lg:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">Tüm Parçalar</h2>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              Yeniden Eskiye
            </div>
          </div>
          
          <div className="mt-6 grid gap-4">
            {tracks.length > 0 ? (
              tracks.map((t) => (
                <TrackCard key={t.id} track={t} canAddToLibrary={!!user} />
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-zinc-200 p-12 text-center dark:border-white/10">
                <Music className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
                <p className="mt-4 text-zinc-500 dark:text-zinc-400">Bu sanatçının henüz yayınlanmış bir eseri bulunmuyor.</p>
              </div>
            )}
          </div>
        </main>
        
        <aside className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl border border-zinc-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/40">
            <h3 className="font-semibold text-zinc-950 dark:text-zinc-50">Sanatçı Hakkında</h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                <Calendar className="h-4 w-4" />
                <span>{new Date(artist.createdAt).getFullYear()} yılından beri Küheylan'da</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                <Mail className="h-4 w-4" />
                <span>İş birliği için iletişime geç</span>
              </div>
            </div>
            
            <button className="mt-6 w-full rounded-full bg-zinc-950 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100">
              Sanatçıyı Takip Et
            </button>
          </div>
          
          <div className="rounded-3xl border border-zinc-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/40">
            <h3 className="font-semibold text-zinc-950 dark:text-zinc-50">Künye</h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Bu sanatçı tarafından yayınlanan tüm eserlerin lisans hakları Küheylan aracılığıyla korunmaktadır. 
              Satın alınan her lisans sanatçının üretim sürecini doğrudan destekler.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
