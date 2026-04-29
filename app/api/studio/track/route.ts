import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type Body = {
  artistId?: unknown;
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

function isYouTubeUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  return u.includes("youtube.com/") || u.includes("youtu.be/") || u.includes("youtube-nocookie.com/");
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = user.role === "ADMIN";
  const isArtist = user.role === "ARTIST";

  if (!isAdmin && !isArtist) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const albumId = typeof body.albumId === "string" ? body.albumId.trim() : "";

  if (!name) return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  if (!albumId) return NextResponse.json({ error: "Invalid album" }, { status: 400 });

  const artistId = isAdmin
    ? typeof body.artistId === "string"
      ? body.artistId
      : ""
    : user.artistId ?? "";

  if (!artistId) return NextResponse.json({ error: "Invalid artist" }, { status: 400 });

  const bpmInt = toInt(body.bpm);
  const bpm = bpmInt !== null ? bpmInt : null;

  const genre = typeof body.genre === "string" ? body.genre.trim() || null : null;

  const cdnAudioUrl = typeof body.cdnAudioUrl === "string" ? body.cdnAudioUrl.trim() : "";
  if (!cdnAudioUrl) return NextResponse.json({ error: "Invalid cdnAudioUrl" }, { status: 400 });
  if (isYouTubeUrl(cdnAudioUrl)) {
    return NextResponse.json(
      {
        error:
          "YouTube linkleri doğrudan şarkı URL’si olarak kullanılamaz. /audio/... gibi direkt bir ses dosyası yolu veya https://... şeklinde mp3/wav dosya URL’si gir.",
      },
      { status: 400 },
    );
  }

  const previewAudioUrl = typeof body.previewAudioUrl === "string" ? body.previewAudioUrl.trim() : "";
  if (previewAudioUrl && isYouTubeUrl(previewAudioUrl)) {
    return NextResponse.json(
      {
        error:
          "YouTube linkleri preview URL olarak da kullanılamaz. /audio/... veya https://... şeklinde direkt ses dosyası URL’si gir.",
      },
      { status: 400 },
    );
  }
  const coverImageUrl = typeof body.coverImageUrl === "string" ? body.coverImageUrl.trim() : "";

  const basePriceCents = toInt(body.basePriceCents);
  const effectivePriceCents = toInt(body.effectivePriceCents);
  if (basePriceCents === null || basePriceCents < 0) {
    return NextResponse.json({ error: "Invalid basePriceCents" }, { status: 400 });
  }
  if (effectivePriceCents === null || effectivePriceCents < 0) {
    return NextResponse.json({ error: "Invalid effectivePriceCents" }, { status: 400 });
  }

  const isAvailable = typeof body.isAvailable === "boolean" ? body.isAvailable : true;

  // Ensure the album belongs to the artist the user is allowed to manage.
  const album = await prisma.album.findUnique({
    where: { id: albumId },
    select: { id: true, artistId: true },
  });

  if (!album || album.artistId !== artistId) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  const track = await prisma.track.create({
    data: {
      name,
      artistId,
      albumId,
      bpm,
      genre,
      cdnAudioUrl,
      previewAudioUrl: previewAudioUrl || null,
      coverImageUrl: coverImageUrl || null,
      basePriceCents,
      effectivePriceCents,
      isAvailable,
    },
    select: { id: true, name: true, artistId: true, albumId: true },
  });

  return NextResponse.json({ ok: true, track });
}
