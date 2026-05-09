import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Sadece ADMIN veya ilgili ARTIST güncelleyebilir
  const isAdmin = user.role === "ADMIN";
  const isTargetArtist = user.role === "ARTIST" && user.artistId === id;

  if (!isAdmin && !isTargetArtist) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const bio = typeof body.bio === "string" ? body.bio.trim() : undefined;
    const profileImageUrl = typeof body.profileImageUrl === "string" ? body.profileImageUrl.trim() : undefined;

    const artist = await prisma.artist.update({
      where: { id },
      data: {
        ...(name && { name }),
        bio, // null da olabilir
        profileImageUrl, // null da olabilir
      },
    });

    return NextResponse.json({ ok: true, artist });
  } catch (err) {
    console.error("Artist update error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
