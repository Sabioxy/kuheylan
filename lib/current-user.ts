import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { hashSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashSessionToken(token);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;

  return session.user;
}
