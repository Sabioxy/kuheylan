import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ids = body.ids;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ tracks: [] });
    }

    const tracks = await prisma.track.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        effectivePriceCents: true,
        coverImageUrl: true,
        artist: { select: { name: true } },
      },
    });

    let ownedSet = new Set<string>();
    const user = await getCurrentUser();
    if (user && tracks.length > 0) {
      const owned = await prisma.userLibrary.findMany({
        where: { userId: user.id, trackId: { in: tracks.map(t => t.id) } },
        select: { trackId: true },
      });
      ownedSet = new Set(owned.map(o => o.trackId));
    }

    const tracksWithOwnership = tracks.map((t) => ({
      ...t,
      isOwned: ownedSet.has(t.id),
    }));

    return NextResponse.json({ tracks: tracksWithOwnership });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
