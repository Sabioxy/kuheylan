import { createHash, randomBytes } from "crypto";

// Cookie names must be "token"-safe
export const SESSION_COOKIE = "kuheylan_session";

/**
 * Şifreleme devre dışı bırakıldı. Şifreyi olduğu gibi döndürür.
 */
export async function hashPassword(password: string) {
  return password;
}

/**
 * Düz metin şifre karşılaştırması yapar.
 */
export async function verifyPassword(password: string, stored: string) {
  if (!stored) return false;

  // Eğer hala eski hash formatında bir şifre varsa ve yeni sisteme geçildiyse
  // kullanıcıyı Prisma Studio üzerinden güncellemen gerekebilir.
  return password === stored;
}

export function newSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("base64");
}
