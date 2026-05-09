import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const trackIds = body.trackIds;
    const giftTargetUsername = typeof body.giftTargetUsername === "string" ? body.giftTargetUsername.trim().toLowerCase() : undefined;

    if (!Array.isArray(trackIds) || trackIds.length === 0) {
      return NextResponse.json({ error: "Sepet boş" }, { status: 400 });
    }

    if (giftTargetUsername === user.username.toLowerCase()) {
      return NextResponse.json({ error: "Kendinize hediye edemezsiniz." }, { status: 400 });
    }

    let targetUserId = user.id;

    if (giftTargetUsername) {
      const targetUser = await prisma.user.findUnique({
        where: { username: giftTargetUsername },
        select: { id: true },
      });
      if (!targetUser) {
        return NextResponse.json({ error: "Hediye edilecek kullanıcı bulunamadı." }, { status: 404 });
      }
      targetUserId = targetUser.id;
    }

    // Fetch all tracks
    const tracks = await prisma.track.findMany({
      where: { id: { in: trackIds }, isAvailable: true },
      include: { artist: { select: { id: true, status: true } } },
    });

    if (tracks.length === 0) {
      return NextResponse.json({ error: "Satın alınabilecek ürün bulunamadı." }, { status: 400 });
    }

    // Filter out already owned tracks (check against targetUserId)
    const owned = await prisma.userLibrary.findMany({
      where: { userId: targetUserId, trackId: { in: tracks.map(t => t.id) } },
      select: { trackId: true },
    });
    const ownedSet = new Set(owned.map(o => o.trackId));

    const tracksToBuy = tracks.filter(t => !ownedSet.has(t.id));

    if (tracksToBuy.length === 0) {
      return NextResponse.json({ error: giftTargetUsername ? "Kullanıcı sepetteki ürünlere zaten sahip." : "Sepetteki ürünlere zaten sahipsiniz." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      for (const track of tracksToBuy) {
        const commissionBps = 1000; // Sabit %10 kesinti
        const commissionCents = Math.round((track.effectivePriceCents * commissionBps) / 10000);
        const artistPayoutCents = track.effectivePriceCents - commissionCents;

        const purchase = await tx.purchase.create({
          data: {
            userId: user.id, // Buyer pays
            trackId: track.id,
            artistId: track.artist.id,
            basePriceCents: track.basePriceCents,
            effectivePriceCents: track.effectivePriceCents,
            commissionBps,
            commissionCents,
            artistPayoutCents,
          },
        });

        await tx.userLibrary.create({
          data: {
            userId: targetUserId, // Target receives the license
            trackId: track.id,
            purchasedAt: new Date(),
            purchaseId: purchase.id,
          },
        });

        // Create notification for recipient if it's a gift
        if (targetUserId !== user.id) {
          await tx.notification.create({
            data: {
              userId: targetUserId,
              type: "GIFT",
              title: "Yeni Bir Hediye!",
              message: `${user.username} sana "${track.name}" şarkısını hediye etti.`,
              metadata: JSON.stringify({
                senderUsername: user.username,
                trackId: track.id,
                trackName: track.name,
              }),
            },
          });
        }

        await tx.artist.update({
          where: { id: track.artist.id },
          data: { balanceCents: { increment: artistPayoutCents } },
        });
      }
    });

    return NextResponse.json({ ok: true, purchasedCount: tracksToBuy.length });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
