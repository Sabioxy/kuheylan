import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting to seed mock data...");

  const artistsData = [
    { name: "The Rockers", bio: "A great rock band", profileImageUrl: "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=500&q=80" },
    { name: "Jazz Master", bio: "Smooth jazz vibes", profileImageUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=500&q=80" },
    { name: "DJ Electro", bio: "EDM and techno beats", profileImageUrl: "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=500&q=80" },
    { name: "Acoustic Soul", bio: "Chill acoustic songs", profileImageUrl: "https://images.unsplash.com/photo-1510915361894-faa8b6339023?w=500&q=80" },
    { name: "Hip Hop Legends", bio: "Old school hip hop", profileImageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80" },
  ];

  for (const artistData of artistsData) {
    const artist = await prisma.artist.create({ data: artistData });
    console.log(`Created artist: ${artist.name}`);

    // Create an album for the artist
    const album = await prisma.album.create({
      data: {
        name: `${artist.name} Greatest Hits`,
        releaseAt: new Date(),
        coverUrl: artist.profileImageUrl,
        artistId: artist.id,
      }
    });
    console.log(`Created album: ${album.name}`);

    // Create 1-2 tracks for the album
    for (let i = 1; i <= 2; i++) {
      const track = await prisma.track.create({
        data: {
          name: `${artist.name} Track ${i}`,
          cdnAudioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          previewAudioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          bpm: 120 + i * 5,
          genre: "Various",
          coverImageUrl: album.coverUrl,
          basePriceCents: 199,
          effectivePriceCents: 199,
          isAvailable: true,
          albumId: album.id,
          artistId: artist.id,
        }
      });
      console.log(`Created track: ${track.name}`);
    }
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
