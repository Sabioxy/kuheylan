import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { AdminStudio } from "./ui";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const artists = await prisma.artist.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const albumsRaw = await prisma.album.findMany({
    orderBy: [{ artist: { name: "asc" } }, { name: "asc" }],
    select: { id: true, name: true, artistId: true, coverUrl: true, releaseAt: true },
  });

  const albums = albumsRaw.map((a) => ({
    ...a,
    releaseAt: a.releaseAt ? a.releaseAt.toISOString() : null,
  }));

  const tracks = await prisma.track.findMany({
    orderBy: [{ artist: { name: "asc" } }, { name: "asc" }],
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
      <h1 className="text-2xl font-semibold">Admin Panel</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sanatçı seçip albüm ve şarkı ekleyebilirsin.
      </p>

      <div className="mt-6">
        <AdminStudio artists={artists} albums={albums} tracks={tracks} />
      </div>
    </div>
  );
}
