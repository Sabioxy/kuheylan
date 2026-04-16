import { createHash, randomBytes, scrypt as _scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(_scrypt);

// Cookie names must be "token"-safe; avoid characters like ':' to prevent invalid Set-Cookie headers.
export const SESSION_COOKIE = "kuheylan_session";

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = (await scrypt(password, salt, 64)) as Buffer;

  return `s2:${salt.toString("base64")}:${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string) {
  if (!stored || !stored.startsWith("s2:")) return false;

  const parts = stored.split(":");
  if (parts.length !== 3) return false;

  const saltB64 = parts[1];
  const keyB64 = parts[2];

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltB64, "base64");
    expected = Buffer.from(keyB64, "base64");
  } catch {
    return false;
  }

  const actual = (await scrypt(password, salt, expected.length)) as Buffer;

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function newSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("base64");
}
