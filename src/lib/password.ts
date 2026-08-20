import { createHash, timingSafeEqual } from "node:crypto";
import { compare, hash } from "bcryptjs";

const BCRYPT_COST = 10;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_COST);
}

export function isLegacyHash(storedHash: string): boolean {
  return /^[0-9a-f]{64}$/i.test(storedHash);
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith("$2")) {
    return compare(password, storedHash);
  }
  if (!isLegacyHash(storedHash)) return false;
  const candidate = Buffer.from(createHash("sha256").update(password).digest("hex"), "hex");
  const stored = Buffer.from(storedHash, "hex");
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}