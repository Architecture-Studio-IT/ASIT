import { SignJWT, jwtVerify } from "jose";

/**
 * Jeton de session : JWT HS256 signé côté serveur, porté par un cookie httpOnly.
 * Ce module ne dépend ni de next/headers ni de Prisma pour rester utilisable
 * dans le middleware (runtime edge).
 */

export const SESSION_COOKIE = "asit_session";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7; // 7 jours

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET manquant ou trop court (32 caractères minimum)");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(userId: number): Promise<string> {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_S}s`)
    .sign(secretKey());
}

/** Renvoie l'id utilisateur, ou null si le jeton est absent, invalide ou expiré. */
export async function verifySessionToken(token: string | undefined): Promise<number | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}
