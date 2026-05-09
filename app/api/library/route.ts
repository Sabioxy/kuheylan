import { NextResponse } from "next/server";

import { Prisma } from "@prisma/client";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type Body = {
  trackId?: unknown;
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const library = await prisma.userLibrary.findMany({
    where: { userId: user.id },
    include: {
      track: {
        include: {
          artist: { select: { name: true } },
        },
      },
    },
    orderBy: { purchasedAt: "desc" },
  });

  const tracks = library.map((entry) => ({
    id: entry.track.id,
    title: entry.track.name,
    subtitle: entry.track.artist.name,
    audioUrl: entry.track.cdnAudioUrl,
  }));

  return NextResponse.json({ tracks });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const trackId = typeof body.trackId === "string" ? body.trackId.trim() : "";
  if (!trackId) {
    return NextResponse.json({ error: "Invalid trackId" }, { status: 400 });
  }

  const existing = await prisma.userLibrary.findUnique({
    where: { userId_trackId: { userId: user.id, trackId } },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ ok: true, alreadyOwned: true });
  }

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: {
      id: true,
      isAvailable: true,
      basePriceCents: true,
      effectivePriceCents: true,
      artistId: true,
    },
  });

  if (!track) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!track.isAvailable) {
    return NextResponse.json({ error: "Not for sale" }, { status: 409 });
  }

  const artist = await prisma.artist.findUnique({
    where: { id: track.artistId },
    select: { id: true, status: true },
  });

  if (!artist) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const commissionBps = artist.status === "STARTER" ? 700 : 1000;
  const commissionCents = Math.round((track.effectivePriceCents * commissionBps) / 10000);
  const artistPayoutCents = track.effectivePriceCents - commissionCents;

  try {
    const purchase = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          userId: user.id,
          trackId: track.id,
          artistId: artist.id,
          basePriceCents: track.basePriceCents,
          effectivePriceCents: track.effectivePriceCents,
          commissionBps,
          commissionCents,
          artistPayoutCents,
        },
        select: { id: true, createdAt: true },
      });

      await tx.userLibrary.create({
        data: {
          userId: user.id,
          trackId: track.id,
          purchasedAt: new Date(),
          purchaseId: purchase.id,
        },
        select: { id: true },
      });

      await tx.artist.update({
        where: { id: artist.id },
        data: { balanceCents: { increment: artistPayoutCents } },
        select: { id: true },
      });

      return purchase;
    });

    return NextResponse.json({ ok: true, purchase });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ ok: true, alreadyOwned: true });
    }

    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
