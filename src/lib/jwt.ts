// src/lib/jwt.ts
import { SignJWT } from "jose";

export const authSecret = import.meta.env.AUTH_SECRET || process.env.AUTH_SECRET;
export const SECRET = new TextEncoder().encode(
  authSecret,
);

export async function createSessionToken(payload: { 
  userId: string, 
  role: string, 
  fullName: string, 
  avatarUrl?: string | null 
}) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET);
}
