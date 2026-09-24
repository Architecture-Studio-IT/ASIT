"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { completeGoogleRegistration, loginWithPassword, registerWithPassword, type AuthState } from "../actions/auth";
import GoogleSignInButton from "./GoogleSignInButton";

const inputClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary";

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-warning" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 text-xs text-text-cool" aria-hidden="true">
      <span className="h-px flex-1 bg-border" />
      ou
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginWithPassword, {});

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4" noValidate>
        {next && <input type="hidden" name="next" value={next} />}
        <Field id="email" label="Adresse email" error={state.fieldErrors?.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={inputClass}
            aria-invalid={!!state.fieldErrors?.email}
            aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          />
        </Field>
        <Field id="password" label="Mot de passe" error={state.fieldErrors?.password}>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
            aria-invalid={!!state.fieldErrors?.password}
            aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
          />
        </Field>
        {state.error && (
          <p className="text-sm text-warning" role="alert">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {pending ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <Divider />
      <GoogleSignInButton mode="login" next={next} />

      <p className="text-center text-sm text-text-cool">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-medium text-primary underline-offset-2 hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(registerWithPassword, {});
  const [cgu, setCgu] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4" noValidate>
        <Field id="name" label="Nom" error={state.fieldErrors?.name}>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className={inputClass}
            aria-invalid={!!state.fieldErrors?.name}
            aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
          />
        </Field>
        <Field id="email" label="Adresse email" error={state.fieldErrors?.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={inputClass}
            aria-invalid={!!state.fieldErrors?.email}
            aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          />
        </Field>
        <Field id="password" label="Mot de passe" error={state.fieldErrors?.password}>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            className={inputClass}
            aria-invalid={!!state.fieldErrors?.password}
            aria-describedby={state.fieldErrors?.password ? "password-error" : "password-hint"}
          />
          {!state.fieldErrors?.password && (
            <p id="password-hint" className="text-xs text-text-cool">
              10 caractères minimum.
            </p>
          )}
        </Field>

        <div className="flex flex-col gap-1.5">
          <label className="flex items-start gap-2 text-sm">
            <input
              id="cgu"
              name="cgu"
              type="checkbox"
              checked={cgu}
              onChange={(e) => setCgu(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary"
              aria-invalid={!!state.fieldErrors?.cgu}
              aria-describedby={state.fieldErrors?.cgu ? "cgu-error" : undefined}
            />
            <span>
              J&apos;ai lu et j&apos;accepte les{" "}
              <Link href="/cgu" target="_blank" className="font-medium text-primary underline-offset-2 hover:underline">
                conditions d&apos;utilisation
              </Link>
              , qui incluent la politique de données personnelles.
            </span>
          </label>
          {state.fieldErrors?.cgu && (
            <p id="cgu-error" className="text-xs text-warning" role="alert">
              {state.fieldErrors.cgu}
            </p>
          )}
        </div>

        {state.error && (
          <p className="text-sm text-warning" role="alert">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {pending ? "Création…" : "Créer mon compte"}
        </button>
      </form>

      <Divider />
      <GoogleSignInButton mode="register" cguAccepted={cgu} />

      <p className="text-center text-sm text-text-cool">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-2 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}

export function GoogleCompleteForm({ email, name, picture }: { email: string; name: string | null; picture: string | null }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(completeGoogleRegistration, {});

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <div className="flex items-center gap-3 rounded-lg border border-border bg-white p-3">
        {picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={picture} alt="" width={40} height={40} className="h-10 w-10 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary" aria-hidden="true">
            {(name ?? email).slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          {name && <p className="truncate text-sm font-medium">{name}</p>}
          <p className="truncate text-sm text-text-cool">{email}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-2 text-sm">
          <input
            id="cgu"
            name="cgu"
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-primary"
            aria-invalid={!!state.fieldErrors?.cgu}
            aria-describedby={state.fieldErrors?.cgu ? "cgu-error" : undefined}
          />
          <span>
            J&apos;ai lu et j&apos;accepte les{" "}
            <Link href="/cgu" target="_blank" className="font-medium text-primary underline-offset-2 hover:underline">
              conditions d&apos;utilisation
            </Link>
            , qui incluent la politique de données personnelles.
          </span>
        </label>
        {state.fieldErrors?.cgu && (
          <p id="cgu-error" className="text-xs text-warning" role="alert">
            {state.fieldErrors.cgu}
          </p>
        )}
      </div>

      {state.error && (
        <p className="text-sm text-warning" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {pending ? "Création…" : "Créer mon compte"}
      </button>

      <p className="text-center text-sm text-text-cool">
        Ce n&apos;est pas vous ?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-2 hover:underline">
          Revenir à la connexion
        </Link>
      </p>
    </form>
  );
}
