import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

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

// DÜZENLEME (PATCH)
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await ctx.params;
  const trackId = params.id;
  const isAdmin = user.role === "ADMIN";
  const isArtist = user.role === "ARTIST";
  if (!isAdmin && !isArtist) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
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
    const nextAlbumId = parseOptionalString(body.albumId);
    const nextCdnAudioUrl = parseOptionalString(body.cdnAudioUrl);
    const nextPreviewAudioUrl = parseOptionalString(body.previewAudioUrl);
    const nextCoverImageUrl = parseOptionalString(body.coverImageUrl);
    const nextGenre = parseOptionalString(body.genre);

    if (nextCdnAudioUrl !== undefined && isYouTubeUrl(nextCdnAudioUrl)) {
      return NextResponse.json({ error: "YouTube linkleri kullanılamaz." }, { status: 400 });
    }

    const updated = await (prisma.track as any).update({
      where: { id: trackId },
      data: {
        ...(nextAlbumId !== undefined ? { album: { connect: { id: nextAlbumId } } } : {}),
        ...(nextName !== undefined ? { name: nextName } : {}),
        ...(nextCdnAudioUrl !== undefined ? { cdnAudioUrl: nextCdnAudioUrl } : {}),
        ...(nextPreviewAudioUrl !== undefined ? { previewAudioUrl: nextPreviewAudioUrl || null } : {}),
        ...(nextCoverImageUrl !== undefined ? { coverImageUrl: nextCoverImageUrl || null } : {}),
        ...(nextGenre !== undefined ? { genre: nextGenre || null } : {}),
        ...(body.bpm !== undefined ? { bpm: toInt(body.bpm) } : {}),
        ...(body.basePriceCents !== undefined ? { basePriceCents: toInt(body.basePriceCents) ?? 0 } : {}),
        ...(body.effectivePriceCents !== undefined ? { effectivePriceCents: toInt(body.effectivePriceCents) ?? 0 } : {}),
        ...(body.isAvailable !== undefined ? { isAvailable: Boolean(body.isAvailable) } : {}),
        ...(isAdmin && body.isSponsored !== undefined ? { isSponsored: Boolean(body.isSponsored) } : {}),
      },
    });

    return NextResponse.json({ ok: true, track: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Güncelleme hatası" }, { status: 500 });
  }
}

// SİLME (DELETE)
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await ctx.params;
  const trackId = params.id;

  try {
    const track = await prisma.track.findUnique({ where: { id: trackId } });
    if (!track) return NextResponse.json({ error: "Şarkı bulunamadı" }, { status: 404 });

    const isAdmin = user.role === "ADMIN";
    const isOwner = user.artistId === track.artistId;
    if (!isAdmin && !isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.track.delete({ where: { id: trackId } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Track deletion error:", err);
    return NextResponse.json({ error: `Silinemedi: ${err.message || "Bilinmeyen hata"}. Muhtemelen bu şarkı bir satış kaydında (Purchase) yer alıyor.` }, { status: 500 });
  }
}
