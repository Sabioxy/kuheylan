import Link from "next/link";

import HomeFavoritesSection from "@/components/HomeFavoritesSection";
import Reveal from "@/components/Reveal";
import ScrollToMarketplace from "@/components/ScrollToMarketplace";
import TrackCard, { type TrackCardModel } from "@/components/TrackCard";
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

export default async function Home() {
  const now = new Date();

  const sponsoredRows = await prisma.promotionTrack.findMany({
    where: {
      isSponsored: true,
      promotion: {
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
    },
    include: {
      track: { include: { artist: { select: { name: true } } } },
    },
    take: 2,
  });

  const sponsored: TrackCardModel[] = sponsoredRows.map((r) => ({
    ...toCardModel(r.track),
    isSponsored: true,
  }));

  const top = await prisma.purchase.groupBy({
    by: ["trackId"],
    _count: { trackId: true },
    orderBy: { _count: { trackId: "desc" } },
    take: 2,
  });

  const topIds = top.map((t) => t.trackId);
  const topTracksRaw = topIds.length
    ? await prisma.track.findMany({
        where: { id: { in: topIds } },
        include: { artist: { select: { name: true } } },
      })
    : [];

  const topById = new Map(topTracksRaw.map((t) => [t.id, t] as const));
  const topSellers: TrackCardModel[] = topIds
    .map((id) => topById.get(id))
    .filter(Boolean)
    .map((t) => toCardModel(t!));

  const fallbackFavoritesRaw = await prisma.track.findMany({
    include: { artist: { select: { name: true } } },
    orderBy: { effectivePriceCents: "asc" },
    take: 2,
  });

  const fallbackFavorites: TrackCardModel[] = fallbackFavoritesRaw.map(toCardModel);

  const forYouRaw = await prisma.track.findMany({
    include: { artist: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 2,
  });

  const forYou: TrackCardModel[] = forYouRaw.map(toCardModel);

  return (
    <div className="bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-950">
      {/* HERO / ANA EKRAN */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-6 pt-14 pb-10 sm:pt-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <div className="text-xs font-medium tracking-wide text-zinc-600 dark:text-zinc-300">
                Dijital Müzik Lisansı • B2C Pazaryeri
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
                Küheylan
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
                Abonelik değil. Her parça bir lisans: satın al, ömür boyu kütüphanende kalsın.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/market"
                  className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                >
                  Satış Yerine Git
                </Link>
                <ScrollToMarketplace targetId="home-market" />
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200/60 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Komisyon</div>
                  <div className="mt-1 text-sm font-semibold">%10 (Yeni: %7)</div>
                </div>
                <div className="rounded-2xl border border-zinc-200/60 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Teslimat</div>
                  <div className="mt-1 text-sm font-semibold">Anında</div>
                </div>
                <div className="rounded-2xl border border-zinc-200/60 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Erişim</div>
                  <div className="mt-1 text-sm font-semibold">Ömür boyu</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-zinc-200/60 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <div className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Sponsorlu</div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Vitrinlenen parçalar.
                </p>
                <div className="mt-4 grid gap-4">
                  {sponsored.map((t) => (
                    <TrackCard key={t.id} track={t} canAddToLibrary={false} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(24,24,27,0.06),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
      </section>

      {/* AŞAĞI KAYDIRINCA AÇILAN "ANA SAYFA SATIŞ" */}
      <section id="home-market" className="mx-auto max-w-6xl px-6 pt-12 pb-20">
        <Reveal className="rounded-3xl border border-zinc-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Ana Sayfa Satış</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                Kaydırınca açılan, bölümlü vitrin.
              </p>
            </div>
            <Link
              href="/market"
              className="inline-flex items-center justify-center rounded-full border border-zinc-200/60 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:bg-white/10"
            >
              Satış yerini aç
            </Link>
          </div>

          <div className="mt-8 grid gap-10">
            <section>
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-base font-semibold">En çok satanlar</h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Popüler lisanslar.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {topSellers.map((t) => (
                  <TrackCard key={t.id} track={t} canAddToLibrary={false} />
                ))}
              </div>
            </section>

            <HomeFavoritesSection fallback={fallbackFavorites} />

            <section>
              <div>
                <h3 className="text-base font-semibold">Senin için</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Yeni eklenenler.</p>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {forYou.map((t) => (
                  <TrackCard key={t.id} track={t} canAddToLibrary={false} />
                ))}
              </div>
            </section>
          </div>

          <footer className="mt-10 border-t border-zinc-200/60 pt-6 text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-400">
            Not: Ana sayfa vitrin; asıl satış yeri /market.
          </footer>
        </Reveal>
      </section>
    </div>
  );
}
