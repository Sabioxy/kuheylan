import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type Params = { trackId: string };

type Body = {
  albumId?: unknown;
  name?: unknown;
  bpm?: unknown;
  genre?: unknown;
  cdnAudioUrl?: unknown;
  previewAudioUrl?: unknown;
  coverImageUrl?: unknown;
  basePriceCents?: unknown;
  effectivePriceCents?: unknown;
  isAvailable?: unknown;
};

function toInt(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && v.trim() && /^-?\d+$/.test(v.trim())) return Number(v);
  return null;
}

function parseOptionalString(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  return v.trim();
}

function isYouTubeUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  return u.includes("youtube.com/") || u.includes("youtu.be/") || u.includes("youtube-nocookie.com/");
}

export async function PATCH(req: Request, ctx: { params: Promise<Params> | Params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = user.role === "ADMIN";
  const isArtist = user.role === "ARTIST";
  if (!isAdmin && !isArtist) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { trackId } = (await ctx.params) as Params;
  if (!trackId) return NextResponse.json({ error: "Invalid track" }, { status: 400 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: { id: true, artistId: true, albumId: true },
  });

  if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });

  if (isArtist) {
    if (!user.artistId || user.artistId !== track.artistId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const nextName = parseOptionalString(body.name);
  if (nextName !== undefined && !nextName) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const nextAlbumId = parseOptionalString(body.albumId);
  if (nextAlbumId !== undefined && !nextAlbumId) {
    return NextResponse.json({ error: "Invalid album" }, { status: 400 });
  }

  const nextCdnAudioUrl = parseOptionalString(body.cdnAudioUrl);
  if (nextCdnAudioUrl !== undefined) {
    if (!nextCdnAudioUrl) return NextResponse.json({ error: "Invalid cdnAudioUrl" }, { status: 400 });
    if (isYouTubeUrl(nextCdnAudioUrl)) {
      return NextResponse.json(
        {
          error:
            "YouTube linkleri doğrudan şarkı URL’si olarak kullanılamaz. /audio/... gibi direkt bir ses dosyası yolu veya https://... şeklinde mp3/wav dosya URL’si gir.",
        },
        { status: 400 },
      );
    }
  }

  const nextPreviewAudioUrl = parseOptionalString(body.previewAudioUrl);
  if (nextPreviewAudioUrl !== undefined) {
    if (nextPreviewAudioUrl && isYouTubeUrl(nextPreviewAudioUrl)) {
      return NextResponse.json(
        {
          error:
            "YouTube linkleri preview URL olarak da kullanılamaz. /audio/... veya https://... şeklinde direkt ses dosyası URL’si gir.",
        },
        { status: 400 },
      );
    }
  }

  const nextCoverImageUrl = parseOptionalString(body.coverImageUrl);
  const nextGenre = parseOptionalString(body.genre);

  let nextBpmInt: number | null | undefined;
  if (body.bpm !== undefined) {
    if (typeof body.bpm === "string" && !body.bpm.trim()) {
      nextBpmInt = null;
    } else {
      const parsed = toInt(body.bpm);
      if (parsed === null) return NextResponse.json({ error: "Invalid bpm" }, { status: 400 });
      nextBpmInt = parsed;
    }
  }

  let nextBasePriceCents: number | undefined;
  if (body.basePriceCents !== undefined) {
    const parsed = toInt(body.basePriceCents);
    if (parsed === null || parsed < 0) {
      return NextResponse.json({ error: "Invalid basePriceCents" }, { status: 400 });
    }
    nextBasePriceCents = parsed;
  }

  let nextEffectivePriceCents: number | undefined;
  if (body.effectivePriceCents !== undefined) {
    const parsed = toInt(body.effectivePriceCents);
    if (parsed === null || parsed < 0) {
      return NextResponse.json({ error: "Invalid effectivePriceCents" }, { status: 400 });
    }
    nextEffectivePriceCents = parsed;
  }

  const nextIsAvailable = typeof body.isAvailable === "boolean" ? body.isAvailable : undefined;

  if (nextAlbumId !== undefined) {
    const album = await prisma.album.findUnique({
      where: { id: nextAlbumId },
      select: { id: true, artistId: true },
    });

    if (!album || album.artistId !== track.artistId) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }
  }

  const updated = await prisma.track.update({
    where: { id: trackId },
    data: {
      ...(nextAlbumId !== undefined ? { album: { connect: { id: nextAlbumId } } } : {}),
      ...(nextName !== undefined ? { name: nextName } : {}),
      ...(nextCdnAudioUrl !== undefined ? { cdnAudioUrl: nextCdnAudioUrl } : {}),
      ...(nextPreviewAudioUrl !== undefined ? { previewAudioUrl: nextPreviewAudioUrl || null } : {}),
      ...(nextCoverImageUrl !== undefined ? { coverImageUrl: nextCoverImageUrl || null } : {}),
      ...(nextGenre !== undefined ? { genre: nextGenre || null } : {}),
      ...(nextBpmInt !== undefined ? { bpm: nextBpmInt } : {}),
      ...(nextBasePriceCents !== undefined ? { basePriceCents: nextBasePriceCents } : {}),
      ...(nextEffectivePriceCents !== undefined ? { effectivePriceCents: nextEffectivePriceCents } : {}),
      ...(nextIsAvailable !== undefined ? { isAvailable: nextIsAvailable } : {}),
    },
    select: {
      id: true,
      name: true,
      artistId: true,
      albumId: true,
      cdnAudioUrl: true,
      previewAudioUrl: true,
      coverImageUrl: true,
      genre: true,
      bpm: true,
      basePriceCents: true,
      effectivePriceCents: true,
      isAvailable: true,
    },
  });

  return NextResponse.json({ ok: true, track: updated });
}
