import { NextResponse } from "next/server";

import { Prisma } from "@prisma/client";

import { hashPassword, hashSessionToken, newSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Body = {
  email?: unknown;
  username?: unknown;
  password?: unknown;
  name?: unknown;
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

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const usernameRaw = typeof body.username === "string" ? body.username.trim() : "";
  const username = usernameRaw.toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : undefined;

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  if (!username || username.length < 3 || username.length > 20 || !/^[a-z0-9_]+$/.test(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  if (!password || password.length < 8 || password.length > 100) {
    return NextResponse.json({ error: "Invalid password" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        name,
      },
      select: { id: true, email: true, username: true, name: true },
    });

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

    const res = NextResponse.json({ ok: true, user });
    setSessionCookie(res, token, maxAgeSeconds);
    return res;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
