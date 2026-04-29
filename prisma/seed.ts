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

  await prisma.user.create({
    data: {
      role: "ADMIN",
      email: "admin@kuheylan.local",
      username: "admin",
      passwordHash: await hashPassword("demo12345"),
      name: "Admin",
    },
  });

  await prisma.user.create({
    data: {
      role: "USER",
      email: "demo@kuheylan.local",
      username: "demo",
      passwordHash: await hashPassword("demo12345"),
      name: "Demo Kullanıcı",
    },
  });

  const sagopa = await prisma.artist.create({
    data: {
      name: "Sagopa Kajmer",
      status: "PREMIUM",
      bio: "Demo içerik (tek sanatçı).",
    },
  });

  await prisma.user.create({
    data: {
      role: "ARTIST",
      email: "sagopa@kuheylan.local",
      username: "sagopa",
      passwordHash: await hashPassword("demo12345"),
      name: "Sagopa",
      artistId: sagopa.id,
    },
  });

  const album = await prisma.album.create({
    data: {
      name: "Photos & Music",
      artistId: sagopa.id,
      coverUrl: "/images/sagopa/kuheylan-cover.jpg",
    },
  });

  await prisma.track.create({
    data: {
      name: "Küheylan",
      artistId: sagopa.id,
      albumId: album.id,
      bpm: null,
      genre: null,
      coverImageUrl: "/images/sagopa/kuheylan-cover.jpg",
      previewAudioUrl: "/audio/sagopa/kuheylan-preview.mp3",
      cdnAudioUrl: "/audio/sagopa/kuheylan-full.mp3",
      basePriceCents: 19900,
      effectivePriceCents: 19900,
      isAvailable: true,
    },
  });

  const demoAudioUrl = "/audio/demo/silence-10s.wav";

  const demoArtists: Array<{
    name: string;
    status: "STARTER" | "MID" | "PREMIUM";
    albumName: string;
    coverUrl: string;
    trackName: string;
    basePriceCents: number;
  }> = [
    {
      name: "Demo Artist 1",
      status: "STARTER",
      albumName: "Demo Albüm 1",
      coverUrl: "/images/demo/demo-artist-1.svg",
      trackName: "Demo Track 1",
      basePriceCents: 9900,
    },
    {
      name: "Demo Artist 2",
      status: "MID",
      albumName: "Demo Albüm 2",
      coverUrl: "/images/demo/demo-artist-2.svg",
      trackName: "Demo Track 2",
      basePriceCents: 14900,
    },
    {
      name: "Demo Artist 3",
      status: "PREMIUM",
      albumName: "Demo Albüm 3",
      coverUrl: "/images/demo/demo-artist-3.svg",
      trackName: "Demo Track 3",
      basePriceCents: 19900,
    },
  ];

  for (const a of demoArtists) {
    const artist = await prisma.artist.create({
      data: {
        name: a.name,
        status: a.status,
        bio: "Demo içerik.",
      },
    });

    const demoAlbum = await prisma.album.create({
      data: {
        name: a.albumName,
        artistId: artist.id,
        coverUrl: a.coverUrl,
      },
    });

    await prisma.track.create({
      data: {
        name: a.trackName,
        artistId: artist.id,
        albumId: demoAlbum.id,
        bpm: null,
        genre: null,
        coverImageUrl: a.coverUrl,
        previewAudioUrl: demoAudioUrl,
        cdnAudioUrl: demoAudioUrl,
        basePriceCents: a.basePriceCents,
        effectivePriceCents: a.basePriceCents,
        isAvailable: true,
      },
    });
  }

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
