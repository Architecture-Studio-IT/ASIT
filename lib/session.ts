import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_S,
  signSessionToken,
  verifySessionToken,
} from "./session-token";
import type { GoogleIdentity } from "./google";

/** Vue de l'utilisateur exposée à l'interface. Jamais le hash de mot de passe. */
export type CurrentUser = {
  id: number;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  hasPassword: boolean;
  hasGoogle: boolean;
  tosAcceptedAt: Date | null;
  tosVersion: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
};

export async function createSession(userId: number): Promise<void> {
  const token = await signSessionToken(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUserId(): Promise<number | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** Utilisateur courant, ou null. Un compte marqué supprimé est traité comme absent. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const u = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      googleSub: true,
      passwordhash: true,
      tosAcceptedAt: true,
      tosVersion: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  if (!u) return null;

  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatarUrl,
    hasPassword: u.passwordhash !== null,
    hasGoogle: u.googleSub !== null,
    tosAcceptedAt: u.tosAcceptedAt,
    tosVersion: u.tosVersion,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
  };
}

/** Comme getCurrentUser, mais lève si personne n'est connecté. Pour les actions serveur. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentification requise");
  return user;
}

// ── Inscription Google en attente ─────────────────────────────────────────────
// Quand un compte Google inconnu se présente sur la page de connexion, on garde
// l'identité déjà vérifiée dans un cookie signé de courte durée, le temps que
// l'utilisateur accepte les CGU sur /register. Le jeton Google n'est jamais
// réutilisé ni exposé dans une URL.

const PENDING_COOKIE = "asit_google_pending";
const PENDING_TTL_S = 10 * 60;

function pendingKey(): Uint8Array {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
}

export async function setPendingGoogleIdentity(identity: GoogleIdentity): Promise<void> {
  const token = await new SignJWT({ ...identity, purpose: "google-pending" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PENDING_TTL_S}s`)
    .sign(pendingKey());
  const store = await cookies();
  store.set(PENDING_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PENDING_TTL_S,
  });
}

export async function getPendingGoogleIdentity(): Promise<GoogleIdentity | null> {
  const store = await cookies();
  const token = store.get(PENDING_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, pendingKey(), { algorithms: ["HS256"] });
    if (payload.purpose !== "google-pending" || typeof payload.sub !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return {
      sub: payload.sub,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : null,
      picture: typeof payload.picture === "string" ? payload.picture : null,
    };
  } catch {
    return null;
  }
}

export async function clearPendingGoogleIdentity(): Promise<void> {
  const store = await cookies();
  store.delete(PENDING_COOKIE);
}
