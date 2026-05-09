import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Music, Tag, User, Play, Plus, BadgePercent, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import TrackCard, { type TrackCardModel } from "@/components/TrackCard";
import TrackDetailActions from "@/components/TrackDetailActions";

export const dynamic = "force-dynamic";

function formatTRYFromCents(cents: number) {
  const value = cents / 100;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(value);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const track = await prisma.track.findUnique({
    where: { id },
    select: { name: true, artist: { select: { name: true } } },
  });

  if (!track) return { title: "Şarkı Bulunamadı" };

  return {
    title: `${track.name} - ${track.artist.name} | Küheylan`,
    description: `${track.artist.name} tarafından hazırlanan ${track.name} isimli parçanın lisans detayları.`,
  };
}

export default async function TrackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const track = await prisma.track.findUnique({
    where: { id },
    include: {
      artist: true,
      album: true,
      promotions: {
        where: {
          promotion: {
            startsAt: { lte: new Date() },
            endsAt: { gte: new Date() },
          },
        },
        include: { promotion: true },
      },
    },
  });

  if (!track) notFound();

  const user = await getCurrentUser();
  let isOwned = false;
  if (user) {
    const owned = await prisma.userLibrary.findUnique({
      where: { userId_trackId: { userId: user.id, trackId: track.id } },
    });
    isOwned = !!owned;
  }

  const relatedTracksRaw = await prisma.track.findMany({
    where: {
      OR: [
        { artistId: track.artistId },
        { genre: track.genre },
      ],
      NOT: { id: track.id },
      isAvailable: true,
    },
    include: { artist: { select: { name: true } } },
    take: 4,
  });

  const relatedTracks: TrackCardModel[] = relatedTracksRaw.map((t) => ({
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
  }));

  const hasDiscount = track.effectivePriceCents < track.basePriceCents;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link
        href="/market"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft className="h-4 w-4" /> Market'e Dön
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-zinc-200/60 bg-zinc-100 shadow-xl dark:border-white/10 dark:bg-white/5">
            {track.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={track.coverImageUrl} alt={track.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800">
                <Music className="h-24 w-24 text-zinc-300 dark:text-zinc-700" />
              </div>
            )}
            {track.promotions.some(p => p.isSponsored) && (
              <div className="absolute left-4 top-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                  <Sparkles className="h-3.5 w-3.5" /> ÖNE ÇIKAN
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {track.name}
                </h1>
                {hasDiscount && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <BadgePercent className="h-4 w-4" /> %{Math.round((1 - track.effectivePriceCents / track.basePriceCents) * 100)} İNDİRİM
                  </span>
                )}
              </div>
              <Link 
                href={`/artist/${track.artistId}`}
                className="mt-2 inline-flex items-center gap-2 text-xl text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
              >
                <User className="h-5 w-5" /> {track.artist.name}
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-zinc-200/60 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Tür</div>
                <div className="mt-1 flex items-center gap-1.5 font-semibold">
                  <Tag className="h-4 w-4 text-zinc-400" /> {track.genre || "Belirtilmemiş"}
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-200/60 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">BPM</div>
                <div className="mt-1 flex items-center gap-1.5 font-semibold">
                  <Clock className="h-4 w-4 text-zinc-400" /> {track.bpm || "--"}
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-200/60 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Albüm</div>
                <div className="mt-1 truncate font-semibold">
                  {track.album?.name || "Single"}
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-200/60 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Yayınlanma</div>
                <div className="mt-1 font-semibold">
                  {new Date(track.createdAt).toLocaleDateString("tr-TR")}
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-zinc-200/60 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">Lisans Bedeli</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-zinc-950 dark:text-zinc-50">
                      {formatTRYFromCents(track.effectivePriceCents)}
                    </span>
                    {hasDiscount && (
                      <span className="text-lg text-zinc-400 line-through">
                        {formatTRYFromCents(track.basePriceCents)}
                      </span>
                    )}
                  </div>
                </div>

                <TrackDetailActions 
                  trackId={track.id}
                  trackName={track.name}
                  artistName={track.artist.name}
                  audioUrl={isOwned ? track.cdnAudioUrl : (track.previewAudioUrl || track.cdnAudioUrl)}
                  isOwned={isOwned}
                  isAvailable={track.isAvailable}
                  canAddToCart={!!user}
                />
              </div>
              <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-400">
                Bu lisansı satın alarak parçayı ticari projelerinizde kullanma hakkına sahip olursunuz. 
                Satın alma sonrası yüksek kaliteli WAV formatı kütüphanenize tanımlanacaktır.
              </p>
            </div>
          </div>
        </div>
      </div>

      {relatedTracks.length > 0 && (
        <section className="mt-20">
          <h2 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">Benzer Parçalar</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedTracks.map((t) => (
              <TrackCard key={t.id} track={t} canAddToLibrary={!!user} isOwned={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
