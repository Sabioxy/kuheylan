import { PrismaClient } from "@prisma/client";

import { randomBytes, scrypt as _scrypt } from "crypto";
import { promisify } from "util";

const prisma = new PrismaClient();

const scrypt = promisify(_scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = (await scrypt(password, salt, 64)) as Buffer;

  return `s2:${salt.toString("base64")}:${key.toString("base64")}`;
}

async function main() {
  // Dev seed: reset and recreate a small dataset.
  // This is intentionally destructive (local dev only).
  await prisma.userLibrary.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.promotionTrack.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.track.deleteMany();
  await prisma.album.deleteMany();
  await prisma.artist.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: "demo@kuheylan.local",
      username: "demo",
      passwordHash: await hashPassword("demo12345"),
      name: "Demo Kullanıcı",
    },
  });

  const aylin = await prisma.artist.create({
    data: {
      name: "Aylin Kaya",
      status: "STARTER",
      bio: "House / club odaklı prodüktör.",
    },
  });

  const baran = await prisma.artist.create({
    data: {
      name: "Baran",
      status: "MID",
      bio: "Lo-fi / şehir gece estetiği.",
    },
  });

  const kuzey = await prisma.artist.create({
    data: {
      name: "Kuzey",
      status: "PREMIUM",
      bio: "Techno — minimal ve sert.",
    },
  });

  const mira = await prisma.artist.create({
    data: {
      name: "Mira",
      status: "STARTER",
      bio: "Indie / dreamy textures.",
    },
  });

  const selim = await prisma.artist.create({
    data: {
      name: "Selim",
      status: "MID",
      bio: "Drum & Bass.",
    },
  });

  const deniz = await prisma.artist.create({
    data: {
      name: "Deniz",
      status: "STARTER",
      bio: "Ambient / film müziği.",
    },
  });

  const albumAylin = await prisma.album.create({
    data: {
      name: "Midnight",
      artistId: aylin.id,
    },
  });
  const albumBaran = await prisma.album.create({
    data: {
      name: "Neon",
      artistId: baran.id,
    },
  });
  const albumKuzey = await prisma.album.create({
    data: {
      name: "Quartz EP",
      artistId: kuzey.id,
    },
  });
  const albumMira = await prisma.album.create({
    data: {
      name: "Salt & Air",
      artistId: mira.id,
    },
  });
  const albumSelim = await prisma.album.create({
    data: {
      name: "Noon",
      artistId: selim.id,
    },
  });
  const albumDeniz = await prisma.album.create({
    data: {
      name: "Soft",
      artistId: deniz.id,
    },
  });

  const tMidnight = await prisma.track.create({
    data: {
      name: "Midnight License",
      artistId: aylin.id,
      albumId: albumAylin.id,
      bpm: 122,
      genre: "House",
      cdnAudioUrl: "/audio/demo.wav",
      previewAudioUrl: "/audio/demo.wav",
      coverImageUrl: null,
      basePriceCents: 19900,
      effectivePriceCents: 14900,
      isAvailable: true,
    },
  });

  const tNeon = await prisma.track.create({
    data: {
      name: "Neon Skyline",
      artistId: baran.id,
      albumId: albumBaran.id,
      bpm: 98,
      genre: "Lo-fi",
      cdnAudioUrl: "/audio/demo.wav",
      previewAudioUrl: "/audio/demo.wav",
      coverImageUrl: null,
      basePriceCents: 12900,
      effectivePriceCents: 12900,
      isAvailable: true,
    },
  });

  const tQuartz = await prisma.track.create({
    data: {
      name: "Quartz",
      artistId: kuzey.id,
      albumId: albumKuzey.id,
      bpm: 128,
      genre: "Techno",
      cdnAudioUrl: "/audio/demo.wav",
      previewAudioUrl: "/audio/demo.wav",
      coverImageUrl: null,
      basePriceCents: 21900,
      effectivePriceCents: 17900,
      isAvailable: true,
    },
  });

  await prisma.track.create({
    data: {
      name: "Salt & Air",
      artistId: mira.id,
      albumId: albumMira.id,
      bpm: 110,
      genre: "Indie",
      cdnAudioUrl: "/audio/demo.wav",
      previewAudioUrl: "/audio/demo.wav",
      coverImageUrl: null,
      basePriceCents: 9900,
      effectivePriceCents: 9900,
      isAvailable: true,
    },
  });

  const tHighNoon = await prisma.track.create({
    data: {
      name: "High Noon",
      artistId: selim.id,
      albumId: albumSelim.id,
      bpm: 140,
      genre: "Drum & Bass",
      cdnAudioUrl: "/audio/demo.wav",
      previewAudioUrl: "/audio/demo.wav",
      coverImageUrl: null,
      basePriceCents: 24900,
      effectivePriceCents: 24900,
      isAvailable: true,
    },
  });

  await prisma.track.create({
    data: {
      name: "Soft Signal",
      artistId: deniz.id,
      albumId: albumDeniz.id,
      bpm: 85,
      genre: "Ambient",
      cdnAudioUrl: "/audio/demo.wav",
      previewAudioUrl: "/audio/demo.wav",
      coverImageUrl: null,
      basePriceCents: 8900,
      effectivePriceCents: 8900,
      isAvailable: false,
    },
  });

  const now = new Date();
  const startsAt = new Date(now.getTime() - 1000 * 60 * 60 * 24);
  const endsAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14);

  await prisma.promotion.create({
    data: {
      name: "Nisan Kampanyası",
      discountPercent: 25,
      startsAt,
      endsAt,
      tracks: {
        create: [
          { trackId: tMidnight.id, isSponsored: true },
          { trackId: tQuartz.id, isSponsored: true },
        ],
      },
    },
  });

  // Seed purchases (top sellers demo)
  const makePurchase = async (trackId: string, artistId: string, count: number) => {
    const track = await prisma.track.findUniqueOrThrow({ where: { id: trackId } });
    for (let i = 0; i < count; i++) {
      const commissionBps = 1000;
      const commissionCents = Math.round((track.effectivePriceCents * commissionBps) / 10000);
      const artistPayoutCents = track.effectivePriceCents - commissionCents;

      await prisma.purchase.create({
        data: {
          userId: user.id,
          trackId: track.id,
          artistId,
          basePriceCents: track.basePriceCents,
          effectivePriceCents: track.effectivePriceCents,
          commissionBps,
          commissionCents,
          artistPayoutCents,
        },
      });
    }
  };

  await makePurchase(tQuartz.id, kuzey.id, 8);
  await makePurchase(tMidnight.id, aylin.id, 5);
  await makePurchase(tHighNoon.id, selim.id, 3);
  await makePurchase(tNeon.id, baran.id, 2);

  // A sample library entry
  await prisma.userLibrary.create({
    data: {
      userId: user.id,
      trackId: tMidnight.id,
      purchasedAt: now,
    },
  });

}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
