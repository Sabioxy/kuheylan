import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hashSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function clearSessionCookie(res: NextResponse) {
  res.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function POST(req: Request) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  if (token) {
    const tokenHash = hashSessionToken(token);
    await prisma.session.deleteMany({ where: { tokenHash } });
  }

  const res = NextResponse.redirect(new URL("/", req.url));
  clearSessionCookie(res);
  return res;
}
