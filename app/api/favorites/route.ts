import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type Body = {
  ids?: unknown;
};

export async function POST(req: Request) {
  const user = await getCurrentUser();

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const idsRaw = body.ids;
  if (!Array.isArray(idsRaw)) {
    return NextResponse.json({ error: "ids must be an array" }, { status: 400 });
  }

  const ids = idsRaw
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 64)
    .slice(0, 30);

  if (ids.length === 0) {
    return NextResponse.json({ tracks: [] });
  }

  const rows = await prisma.track.findMany({
    where: { id: { in: ids } },
    include: { artist: { select: { name: true } } },
  });

  const ownedSet = new Set<string>();
  if (user && ids.length) {
    const owned = await prisma.userLibrary.findMany({
      where: { userId: user.id, trackId: { in: ids } },
      select: { trackId: true },
    });
    for (const row of owned) ownedSet.add(row.trackId);
  }

  const byId = new Map(rows.map((t) => [t.id, t] as const));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean);

  const tracks = ordered.map((t) => ({
    id: t!.id,
    name: t!.name,
    artistName: t!.artist.name,
    bpm: t!.bpm ?? undefined,
    genre: t!.genre ?? undefined,
    basePriceCents: t!.basePriceCents,
    effectivePriceCents: t!.effectivePriceCents,
    isAvailable: t!.isAvailable,
    imageUrl: t!.coverImageUrl ?? undefined,
    audioUrl: ownedSet.has(t!.id) ? t!.cdnAudioUrl : (t!.previewAudioUrl ?? t!.cdnAudioUrl),
  }));

  return NextResponse.json({ tracks });
}
