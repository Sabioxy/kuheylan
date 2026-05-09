import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

function parseOptionalString(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  return v.trim();
}

function parseOptionalDateOrNull(v: unknown): Date | null | undefined {
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  if (!trimmed) return null;
  const dt = new Date(trimmed);
  if (Number.isNaN(dt.getTime())) return undefined;
  return dt;
}

// DÜZENLEME (PATCH)
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await ctx.params;
  const albumId = params.id;
  const isAdmin = user.role === "ADMIN";
  const isArtist = user.role === "ARTIST";
  if (!isAdmin && !isArtist) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      select: { id: true, artistId: true },
    });

    if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404 });

    if (isArtist) {
      if (!user.artistId || user.artistId !== album.artistId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const nextName = parseOptionalString(body.name);
    const nextCoverUrl = parseOptionalString(body.coverUrl);
    const nextReleaseAt = parseOptionalDateOrNull(body.releaseAt);

    const updated = await prisma.album.update({
      where: { id: albumId },
      data: {
        ...(nextName !== undefined ? { name: nextName } : {}),
        ...(nextCoverUrl !== undefined ? { coverUrl: nextCoverUrl || null } : {}),
        ...(nextReleaseAt !== undefined ? { releaseAt: nextReleaseAt } : {}),
      },
      select: { id: true, name: true, artistId: true, coverUrl: true, releaseAt: true },
    });

    return NextResponse.json({ ok: true, album: updated });
  } catch (err) {
    return NextResponse.json({ error: "Güncelleme hatası" }, { status: 500 });
  }
}

// SİLME (DELETE)
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await ctx.params;
  const albumId = params.id;

  try {
    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album) return NextResponse.json({ error: "Albüm bulunamadı" }, { status: 404 });

    const isAdmin = user.role === "ADMIN";
    const isOwner = user.artistId === album.artistId;
    if (!isAdmin && !isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.album.delete({ where: { id: albumId } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Album deletion error:", err);
    return NextResponse.json({ error: `Silinemedi: ${err.message || "Bilinmeyen hata"}. Muhtemelen içindeki bir şarkı satın alınmış.` }, { status: 500 });
  }
}
