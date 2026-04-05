// src/lib/jwt.ts
import { SignJWT } from "jose";

export const authSecret = import.meta.env.AUTH_SECRET || process.env.AUTH_SECRET;
export const SECRET = new TextEncoder().encode(
  authSecret || "rahasia-darurat-biar-gak-crash",
);

export async function createSessionToken(userId: string) {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET);
}
