import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const usernameRaw = typeof body.username === "string" ? body.username.trim() : "";
    const username = usernameRaw.toLowerCase();
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!username || username.length < 3 || username.length > 20 || !/^[a-z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: "Kullanıcı adı geçersiz." }, { status: 400 });
    }

    const updates: Prisma.UserUpdateInput = { name, username };

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Yeni şifre belirlemek için mevcut şifrenizi girmelisiniz." }, { status: 400 });
      }

      if (newPassword.length < 8 || newPassword.length > 100) {
        return NextResponse.json({ error: "Yeni şifre geçersiz." }, { status: 400 });
      }

      const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
      if (!dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const isValid = await verifyPassword(currentPassword, dbUser.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Mevcut şifre hatalı." }, { status: 400 });
      }

      updates.passwordHash = await hashPassword(newPassword);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updates,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Bu kullanıcı adı zaten alınmış." }, { status: 409 });
    }
    console.error("Settings error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
