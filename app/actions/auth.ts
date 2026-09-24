"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  createSession,
  destroySession,
  requireUser,
  setPendingGoogleIdentity,
  getPendingGoogleIdentity,
  clearPendingGoogleIdentity,
} from "@/lib/session";
import { verifyGoogleCredential } from "@/lib/google";
import { CGU_VERSION } from "@/lib/legal";

/** Coût bcrypt : 12 tours, valeur retenue dans la politique de sécurité. */
const BCRYPT_ROUNDS = 12;

export type AuthState = {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "name" | "cgu", string>>;
};

const emailSchema = z.string().trim().toLowerCase().email("Adresse email invalide");
const passwordSchema = z
  .string()
  .min(10, "10 caractères minimum")
  .max(200, "200 caractères maximum");
const nameSchema = z.string().trim().min(1, "Nom requis").max(80, "80 caractères maximum");

/** Destination après connexion : uniquement un chemin interne, jamais une URL externe. */
function safeNext(raw: FormDataEntryValue | null): string {
  const s = typeof raw === "string" ? raw : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/dashboard";
}

async function touchLogin(userId: number) {
  await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
}

// ── Inscription email / mot de passe ──────────────────────────────────────────

export async function registerWithPassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z
    .object({
      name: nameSchema,
      email: emailSchema,
      password: passwordSchema,
      cgu: z.literal("on", { message: "Vous devez accepter les conditions d'utilisation" }),
    })
    .safeParse({
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      cgu: form.get("cgu"),
    });

  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        name: fe.name?.[0],
        email: fe.email?.[0],
        password: fe.password?.[0],
        cgu: fe.cgu?.[0],
      },
    };
  }

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { fieldErrors: { email: "Un compte existe déjà avec cette adresse" } };
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordhash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      tosAcceptedAt: new Date(),
      tosVersion: CGU_VERSION,
      lastLoginAt: new Date(),
    },
    select: { id: true },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

// ── Connexion email / mot de passe ────────────────────────────────────────────

export async function loginWithPassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1, "Mot de passe requis") })
    .safeParse({ email: form.get("email"), password: form.get("password") });

  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return { fieldErrors: { email: fe.email?.[0], password: fe.password?.[0] } };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true, passwordhash: true },
  });

  // Même message quel que soit le cas : ne pas révéler si l'adresse existe.
  const invalid: AuthState = { error: "Identifiants incorrects" };
  if (!user?.passwordhash) return invalid;
  if (!(await bcrypt.compare(password, user.passwordhash))) return invalid;

  await touchLogin(user.id);
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

// ── Google (OAuth2 / OpenID Connect via Google Identity Services) ─────────────

export type GoogleAuthResult = { error?: string; redirectTo?: string };

/**
 * mode "login"    : le compte doit exister (par googleSub, ou par email pour
 *                   lier un compte mot de passe existant).
 * mode "register" : crée le compte ; exige l'acceptation des CGU.
 */
export async function authenticateWithGoogle(input: {
  credential: string;
  mode: "login" | "register";
  cguAccepted?: boolean;
  next?: string;
}): Promise<GoogleAuthResult> {
  let identity;
  try {
    identity = await verifyGoogleCredential(input.credential);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Jeton Google invalide" };
  }

  const bySub = await prisma.user.findUnique({ where: { googleSub: identity.sub }, select: { id: true, deletedAt: true } });
  if (bySub && !bySub.deletedAt) {
    await touchLogin(bySub.id);
    await createSession(bySub.id);
    return { redirectTo: safeNext(input.next ?? null) };
  }

  // Compte existant avec la même adresse (créé par mot de passe) : on le lie.
  const byEmail = await prisma.user.findFirst({
    where: { email: identity.email, deletedAt: null },
    select: { id: true },
  });
  if (byEmail) {
    await prisma.user.update({
      where: { id: byEmail.id },
      data: { googleSub: identity.sub, avatarUrl: identity.picture ?? undefined, lastLoginAt: new Date() },
    });
    await createSession(byEmail.id);
    return { redirectTo: safeNext(input.next ?? null) };
  }

  // Compte inconnu depuis la page de connexion : on ne crée rien sans
  // acceptation des CGU. L'identité vérifiée est conservée le temps de
  // finaliser l'inscription.
  if (input.mode === "login" || !input.cguAccepted) {
    await setPendingGoogleIdentity(identity);
    return { redirectTo: "/register?google=1" };
  }

  const user = await createGoogleUser(identity);
  await createSession(user.id);
  return { redirectTo: "/dashboard" };
}

async function createGoogleUser(identity: { sub: string; email: string; name: string | null; picture: string | null }) {
  return prisma.user.create({
    data: {
      email: identity.email,
      name: identity.name,
      avatarUrl: identity.picture,
      googleSub: identity.sub,
      tosAcceptedAt: new Date(),
      tosVersion: CGU_VERSION,
      lastLoginAt: new Date(),
    },
    select: { id: true },
  });
}

/** Finalisation d'une inscription Google : l'identité vient du cookie signé, il ne manque que les CGU. */
export async function completeGoogleRegistration(_prev: AuthState, form: FormData): Promise<AuthState> {
  const identity = await getPendingGoogleIdentity();
  if (!identity) {
    return { error: "Session Google expirée. Recommencez la connexion avec Google." };
  }
  if (form.get("cgu") !== "on") {
    return { fieldErrors: { cgu: "Vous devez accepter les conditions d'utilisation" } };
  }

  // Le compte a pu être créé entre-temps (autre onglet) : on le lie plutôt que d'échouer.
  const existing = await prisma.user.findFirst({
    where: { OR: [{ googleSub: identity.sub }, { email: identity.email }], deletedAt: null },
    select: { id: true },
  });
  const userId = existing
    ? (await prisma.user.update({
        where: { id: existing.id },
        data: { googleSub: identity.sub, avatarUrl: identity.picture ?? undefined, lastLoginAt: new Date() },
        select: { id: true },
      })).id
    : (await createGoogleUser(identity)).id;

  await clearPendingGoogleIdentity();
  await createSession(userId);
  redirect("/dashboard");
}

// ── Session ───────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

// ── Profil ────────────────────────────────────────────────────────────────────

export type ProfileState = { error?: string; success?: string; fieldErrors?: Partial<Record<"name" | "password", string>> };

export async function updateProfile(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await requireUser();
  const parsed = z
    .object({
      name: nameSchema,
      password: z.union([z.literal(""), passwordSchema]),
    })
    .safeParse({ name: form.get("name"), password: form.get("password") ?? "" });

  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return { fieldErrors: { name: fe.name?.[0], password: fe.password?.[0] } };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      ...(parsed.data.password ? { passwordhash: await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS) } : {}),
    },
  });
  revalidatePath("/profile");
  return { success: "Profil mis à jour" };
}

/** Acceptation d'une nouvelle version des CGU par un compte existant. */
export async function acceptCurrentCgu(): Promise<void> {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { tosAcceptedAt: new Date(), tosVersion: CGU_VERSION },
  });
  revalidatePath("/profile");
}

/** Droit à l'effacement (RGPD art. 17) : suppression réelle, projets compris (cascade). */
export async function deleteAccount(form: FormData): Promise<void> {
  const user = await requireUser();
  if (form.get("confirm") !== user.email) {
    throw new Error("Confirmation incorrecte");
  }
  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect("/login");
}
