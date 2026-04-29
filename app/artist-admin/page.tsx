import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { ArtistStudio } from "./ui";

export default async function ArtistAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ARTIST") redirect("/");
  if (!user.artistId) redirect("/");

  const artist = await prisma.artist.findUnique({
    where: { id: user.artistId },
    select: { id: true, name: true },
  });

  if (!artist) redirect("/");

  const albumsRaw = await prisma.album.findMany({
    where: { artistId: artist.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, coverUrl: true, releaseAt: true },
  });

  const albums = albumsRaw.map((a) => ({
    ...a,
    releaseAt: a.releaseAt ? a.releaseAt.toISOString() : null,
  }));

  const tracks = await prisma.track.findMany({
    where: { artistId: artist.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      artistId: true,
      albumId: true,
      cdnAudioUrl: true,
      previewAudioUrl: true,
      coverImageUrl: true,
      genre: true,
      bpm: true,
      basePriceCents: true,
      effectivePriceCents: true,
      isAvailable: true,
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Şarkıcı Paneli</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {artist.name} için albüm ve şarkı ekleyebilirsin.
      </p>

      <div className="mt-6">
        <ArtistStudio artistId={artist.id} albums={albums} tracks={tracks} />
      </div>
    </div>
  );
}
