import Link from "next/link";

import type { Prisma } from "@prisma/client";

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
  promotions: Array<{ promotionId: string }>;
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
    isSponsored: t.promotions.length > 0,
    imageUrl: t.coverImageUrl ?? undefined,
    audioUrl: t.previewAudioUrl ?? t.cdnAudioUrl,
  };
}

type MarketSearchParams = {
  sort?: string | string[];
  price?: string | string[];

  genre?: string | string[];
  bpmMin?: string | string[];
  available?: string | string[];
  sponsored?: string | string[];
};

export default async function MarketPage({
  searchParams,
}: {
  searchParams?: MarketSearchParams | Promise<MarketSearchParams>;
}) {
  const now = new Date();

  const sp = await Promise.resolve(searchParams ?? {});

  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const sortParam = first(sp.sort);
  const priceParam = first(sp.price);
  const genre = first(sp.genre);
  const bpmMinRaw = first(sp.bpmMin);
  const availableParam = first(sp.available);
  const sponsoredParam = first(sp.sponsored);

  const sort: "popular" | "new" = sortParam === "popular" ? "popular" : "new";
  const price: "asc" | "desc" | undefined =
    priceParam === "asc" || priceParam === "desc" ? priceParam : undefined;

  const bpmMin = bpmMinRaw && /^[0-9]+$/.test(bpmMinRaw) ? Number(bpmMinRaw) : undefined;
  const availableOnly = availableParam === "1";
  const sponsoredOnly = sponsoredParam === "1";

  const currentParams = new URLSearchParams();
  currentParams.set("sort", sort);
  if (price) currentParams.set("price", price);
  if (genre) currentParams.set("genre", genre);
  if (bpmMin !== undefined) currentParams.set("bpmMin", String(bpmMin));
  if (availableOnly) currentParams.set("available", "1");
  if (sponsoredOnly) currentParams.set("sponsored", "1");

  const hrefFor = (
    patch: Partial<Record<keyof MarketSearchParams, string | null>>,
  ) => {
    const sp = new URLSearchParams(currentParams);

    for (const [key, value] of Object.entries(patch)) {
      if (value === null) sp.delete(key);
      else if (typeof value === "string") sp.set(key, value);
    }

    const qs = sp.toString();
    return qs ? `/market?${qs}` : "/market";
  };

  const sortHref = hrefFor({ sort: sort === "popular" ? "new" : "popular" });
  const priceHref = hrefFor({ price: price === "asc" ? "desc" : "asc" });

  const hasFilters = Boolean(
    genre || bpmMin !== undefined || availableOnly || sponsoredOnly,
  );
  const clearFiltersHref = hrefFor({
    genre: null,
    bpmMin: null,
    available: null,
    sponsored: null,
  });

  const orderBy: Array<Record<string, unknown>> = [];
  if (sort === "popular") {
    orderBy.push({ purchases: { _count: "desc" } });
  } else {
    orderBy.push({ createdAt: "desc" });
  }
  if (price) {
    orderBy.push({ effectivePriceCents: price });
  }

  const where: Prisma.TrackWhereInput = {};
  if (genre) where.genre = genre;
  if (bpmMin !== undefined) where.bpm = { gte: bpmMin };
  if (availableOnly) where.isAvailable = true;
  if (sponsoredOnly) {
    where.promotions = {
      some: {
        isSponsored: true,
        promotion: {
          startsAt: { lte: now },
          endsAt: { gte: now },
        },
      },
    };
  }

  const tracks = await prisma.track.findMany({
    where,
    include: {
      artist: { select: { name: true } },
      promotions: {
        where: {
          isSponsored: true,
          promotion: {
            startsAt: { lte: now },
            endsAt: { gte: now },
          },
        },
        select: { promotionId: true },
        take: 1,
      },
    },
    orderBy,
    take: 30,
  });

  const products = tracks.map(toCardModel);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Satış Yeri
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Trendyol benzeri katalog: filtreler + grid.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="rounded-3xl border border-zinc-200/60 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="text-sm font-semibold">Filtreler</div>

            <div className="mt-4 space-y-5 text-sm">
              <div className="flex justify-end">
                {hasFilters ? (
                  <Link
                    href={clearFiltersHref}
                    className="text-xs text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-300"
                  >
                    Temizle
                  </Link>
                ) : null}
              </div>

              <div>
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tür</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    "House",
                    "Techno",
                    "Lo-fi",
                    "Indie",
                    "Ambient",
                    "Drum & Bass",
                  ].map((g) => {
                    const selected = genre === g;
                    return (
                      <Link
                        key={g}
                        href={hrefFor({ genre: selected ? null : g })}
                        className={
                          selected
                            ? "rounded-full border border-zinc-900 bg-zinc-950 px-3 py-1 text-xs text-white dark:border-white dark:bg-white dark:text-zinc-950"
                            : "rounded-full border border-zinc-200/60 bg-white px-3 py-1 text-xs text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                        }
                      >
                        {g}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">BPM</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {[80, 120, 140].map((min) => {
                    const selected = bpmMin === min;
                    return (
                      <Link
                        key={min}
                        href={hrefFor({ bpmMin: selected ? null : String(min) })}
                        className={
                          selected
                            ? "rounded-full border border-zinc-900 bg-zinc-950 px-3 py-1 text-xs text-white dark:border-white dark:bg-white dark:text-zinc-950"
                            : "rounded-full border border-zinc-200/60 bg-white px-3 py-1 text-xs text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                        }
                      >
                        {min}+
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Durum</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    href={hrefFor({ available: availableOnly ? null : "1" })}
                    className={
                      availableOnly
                        ? "rounded-full border border-zinc-900 bg-zinc-950 px-3 py-1 text-xs text-white dark:border-white dark:bg-white dark:text-zinc-950"
                        : "rounded-full border border-zinc-200/60 bg-white px-3 py-1 text-xs text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                    }
                  >
                    Satışta
                  </Link>
                  <Link
                    href={hrefFor({ sponsored: sponsoredOnly ? null : "1" })}
                    className={
                      sponsoredOnly
                        ? "rounded-full border border-zinc-900 bg-zinc-950 px-3 py-1 text-xs text-white dark:border-white dark:bg-white dark:text-zinc-950"
                        : "rounded-full border border-zinc-200/60 bg-white px-3 py-1 text-xs text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                    }
                  >
                    Sponsorlu
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-9">
          <div className="rounded-3xl border border-zinc-200/60 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold">Ürünler</div>
              <div className="flex items-center gap-2">
                <Link
                  href={sortHref}
                  className="rounded-full border border-zinc-200/60 bg-white px-3 py-1 text-xs text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                  title="Sıralamayı değiştir"
                >
                  Sıralama: {sort === "popular" ? "Popüler" : "Yeni"}
                </Link>
                <Link
                  href={priceHref}
                  className="rounded-full border border-zinc-200/60 bg-white px-3 py-1 text-xs text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                  title="Fiyat sırasını değiştir"
                >
                  Fiyat: {price ? (price === "desc" ? "Azalan" : "Artan") : "Kapalı"}
                </Link>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => (
                <TrackCard key={p.id} track={p} canAddToLibrary={false} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
