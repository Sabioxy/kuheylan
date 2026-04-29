import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type Body = {
  artistId?: unknown;
  name?: unknown;
  releaseAt?: unknown;
  coverUrl?: unknown;
};

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
  if (!name) return NextResponse.json({ error: "Invalid name" }, { status: 400 });

  const coverUrl = typeof body.coverUrl === "string" ? body.coverUrl.trim() : undefined;

  let releaseAt: Date | undefined;
  if (typeof body.releaseAt === "string" && body.releaseAt.trim()) {
    const dt = new Date(body.releaseAt);
    if (!Number.isNaN(dt.getTime())) releaseAt = dt;
  }

  const artistId = isAdmin
    ? typeof body.artistId === "string"
      ? body.artistId
      : ""
    : user.artistId ?? "";

  if (!artistId) return NextResponse.json({ error: "Invalid artist" }, { status: 400 });

  const album = await prisma.album.create({
    data: {
      artistId,
      name,
      releaseAt,
      coverUrl: coverUrl || null,
    },
    select: { id: true, name: true, artistId: true },
  });

  return NextResponse.json({ ok: true, album });
}
