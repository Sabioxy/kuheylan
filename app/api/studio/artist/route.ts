import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const adminUser = await getCurrentUser();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Sadece ADMIN sanatçı ekleyebilir
  if (adminUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const bio = typeof body.bio === "string" ? body.bio.trim() : undefined;
    const profileImageUrl = typeof body.profileImageUrl === "string" ? body.profileImageUrl.trim() : undefined;
    
    // Yeni giriş bilgileri
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || !email || !username || !password) {
      return NextResponse.json({ error: "Tüm alanlar (Ad, E-posta, Kullanıcı Adı, Şifre) zorunludur" }, { status: 400 });
    }

    // Email veya Username çakışması var mı kontrol et
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    if (existing) {
      return NextResponse.json({ error: "E-posta veya kullanıcı adı zaten kullanımda" }, { status: 400 });
    }

    // Transaction ile hem Artist hem User oluşturuyoruz
    const result = await prisma.$transaction(async (tx) => {
      // 1. Artist oluştur
      const artist = await tx.artist.create({
        data: {
          name,
          bio,
          profileImageUrl,
        },
      });

      // 2. User oluştur ve Artist'e bağla
      const user = await tx.user.create({
        data: {
          email,
          username,
          passwordHash: await hashPassword(password),
          role: "ARTIST",
          artistId: artist.id,
          name: name, // User tablosundaki isim alanı
        },
      });

      return { artist, user };
    });

    return NextResponse.json({ ok: true, artist: result.artist, user: result.user });
  } catch (err) {
    console.error("Artist & User creation error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
