import { NextResponse } from "next/server";

import { hashSessionToken, newSessionToken, SESSION_COOKIE, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Body = {
  identifier?: unknown;
  password?: unknown;
};

function setSessionCookie(res: NextResponse, token: string, maxAgeSeconds: number) {
  res.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const identifierRaw = typeof body.identifier === "string" ? body.identifier.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!identifierRaw || !password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  try {
    const identifierLower = identifierRaw.toLowerCase();

    const user = identifierRaw.includes("@")
      ? await prisma.user.findUnique({ where: { email: identifierLower } })
      : await prisma.user.findUnique({ where: { username: identifierLower } });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = newSessionToken();
    const tokenHash = hashSessionToken(token);
    const maxAgeSeconds = 60 * 60 * 24 * 30;

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + maxAgeSeconds * 1000),
      },
    });

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, username: user.username, name: user.name },
    });
    setSessionCookie(res, token, maxAgeSeconds);
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

