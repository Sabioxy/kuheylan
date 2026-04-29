import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Sadece ADMIN sanatçı ekleyebilir
  const isAdmin = user.role === "ADMIN";
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const bio = typeof body.bio === "string" ? body.bio.trim() : undefined;
    const profileImageUrl = typeof body.profileImageUrl === "string" ? body.profileImageUrl.trim() : undefined;

    if (!name) {
      return NextResponse.json({ error: "Sanatçı adı zorunludur" }, { status: 400 });
    }

    const artist = await prisma.artist.create({
      data: {
        name,
        bio,
        profileImageUrl,
      },
    });

    return NextResponse.json({ ok: true, artist });
  } catch (err) {
    console.error("Artist creation error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
