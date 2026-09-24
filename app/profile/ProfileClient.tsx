"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Download, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { acceptCurrentCgu, deleteAccount, logout, updateProfile, type ProfileState } from "../actions/auth";
import type { CurrentUser } from "@/lib/session";

const inputClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary";

function fmt(d: Date | null | string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function ProfileClient({ user, cguVersion }: { user: CurrentUser; cguVersion: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});
  const cguOutdated = user.tosVersion !== cguVersion;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-10">
      <div className="flex items-center gap-4">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" width={56} height={56} className="h-14 w-14 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary" aria-hidden="true">
            {(user.name ?? user.email).slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{user.name ?? "Mon profil"}</h1>
          <p className="text-sm text-text-cool">{user.email}</p>
        </div>
      </div>

      {cguOutdated && (
        <div className="flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning/5 p-4" role="status">
          <p className="text-sm">
            Les conditions d&apos;utilisation ont été mises à jour (version {cguVersion}). Vous aviez accepté la version{" "}
            {user.tosVersion ?? "—"}.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/cgu" className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface">
              Lire les conditions
            </Link>
            <form action={acceptCurrentCgu}>
              <button type="submit" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90">
                J&apos;accepte la nouvelle version
              </button>
            </form>
          </div>
        </div>
      )}

      <section aria-labelledby="infos" className="rounded-xl border border-border bg-white p-5">
        <h2 id="infos" className="mb-4 text-base font-semibold">
          Informations
        </h2>
        <form action={action} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              Nom
            </label>
            <input id="name" name="name" defaultValue={user.name ?? ""} required className={inputClass} aria-describedby={state.fieldErrors?.name ? "name-error" : undefined} />
            {state.fieldErrors?.name && (
              <p id="name-error" className="text-xs text-warning" role="alert">
                {state.fieldErrors.name}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email-ro" className="text-sm font-medium">
              Adresse email
            </label>
            <input id="email-ro" value={user.email} readOnly className={`${inputClass} bg-surface text-text-cool`} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              {user.hasPassword ? "Nouveau mot de passe" : "Définir un mot de passe"}
            </label>
            <input id="password" name="password" type="password" autoComplete="new-password" className={inputClass} aria-describedby="password-hint" />
            <p id="password-hint" className="text-xs text-text-cool">
              Laissez vide pour ne rien changer. 10 caractères minimum.
            </p>
            {state.fieldErrors?.password && (
              <p className="text-xs text-warning" role="alert">
                {state.fieldErrors.password}
              </p>
            )}
          </div>
          {state.success && (
            <p className="text-sm text-primary" role="status">
              {state.success}
            </p>
          )}
          {state.error && (
            <p className="text-sm text-warning" role="alert">
              {state.error}
            </p>
          )}
          <div>
            <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
              {pending ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </section>

      <section aria-labelledby="compte" className="rounded-xl border border-border bg-white p-5">
        <h2 id="compte" className="mb-4 text-base font-semibold">
          Compte
        </h2>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-text-cool">Méthodes de connexion</dt>
            <dd className="font-medium">
              {[user.hasPassword && "Mot de passe", user.hasGoogle && "Google"].filter(Boolean).join(" · ") || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-text-cool">Compte créé le</dt>
            <dd className="font-medium">{fmt(user.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-text-cool">Dernière connexion</dt>
            <dd className="font-medium">{fmt(user.lastLoginAt)}</dd>
          </div>
          <div>
            <dt className="text-text-cool">Conditions acceptées</dt>
            <dd className="flex items-center gap-1.5 font-medium">
              <ShieldCheck size={14} className="text-primary" aria-hidden="true" />
              version {user.tosVersion ?? "—"} · {fmt(user.tosAcceptedAt)}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="donnees" className="rounded-xl border border-border bg-white p-5">
        <h2 id="donnees" className="mb-1 text-base font-semibold">
          Vos données
        </h2>
        <p className="mb-4 text-sm text-text-cool">
          Vous pouvez à tout moment récupérer l&apos;ensemble de vos données ou supprimer votre compte. La suppression est
          immédiate et définitive : vos projets sont effacés avec le compte.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="/api/account/export" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface">
            <Download size={14} aria-hidden="true" />
            Exporter mes données (JSON)
          </a>
          <form action={logout}>
            <button type="submit" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface">
              <LogOut size={14} aria-hidden="true" />
              Se déconnecter
            </button>
          </form>
        </div>

        <form action={deleteAccount} className="mt-6 flex flex-col gap-2 border-t border-border pt-5">
          <label htmlFor="confirm" className="text-sm font-medium">
            Supprimer mon compte
          </label>
          <p className="text-xs text-text-cool">
            Saisissez votre adresse email <span className="font-mono">{user.email}</span> pour confirmer.
          </p>
          <div className="flex flex-wrap gap-2">
            <input id="confirm" name="confirm" type="email" autoComplete="off" className={`${inputClass} max-w-xs`} />
            <button type="submit" className="inline-flex items-center gap-2 rounded-lg border border-warning px-3 py-2 text-sm text-warning hover:bg-warning/5">
              <Trash2 size={14} aria-hidden="true" />
              Supprimer définitivement
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
