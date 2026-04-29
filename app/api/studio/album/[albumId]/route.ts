import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type Params = { albumId: string };

type Body = {
  name?: unknown;
  releaseAt?: unknown;
  coverUrl?: unknown;
};

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

export async function PATCH(req: Request, ctx: { params: Promise<Params> | Params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = user.role === "ADMIN";
  const isArtist = user.role === "ARTIST";
  if (!isAdmin && !isArtist) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { albumId } = (await ctx.params) as Params;
  if (!albumId) return NextResponse.json({ error: "Invalid album" }, { status: 400 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

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
  if (nextName !== undefined && !nextName) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const nextCoverUrl = parseOptionalString(body.coverUrl);
  const nextReleaseAt = parseOptionalDateOrNull(body.releaseAt);

  if (nextReleaseAt === undefined && body.releaseAt !== undefined) {
    return NextResponse.json({ error: "Invalid releaseAt" }, { status: 400 });
  }

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
}
