"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticateWithGoogle } from "../actions/auth";

/**
 * Bouton « Continuer avec Google » basé sur Google Identity Services,
 * la bibliothèque officielle de Google côté navigateur. Le jeton d'identité
 * renvoyé (credential) est vérifié côté serveur avec google-auth-library.
 */

type GsiCredentialResponse = { credential: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: {
            client_id: string;
            callback: (response: GsiCredentialResponse) => void;
            ux_mode?: "popup" | "redirect";
            auto_select?: boolean;
          }): void;
          renderButton(
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill";
              locale?: string;
              width?: number;
            },
          ): void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  mode: "login" | "register";
  /** En inscription : le bouton n'est actif qu'une fois les CGU acceptées. */
  cguAccepted?: boolean;
  next?: string;
}

export default function GoogleSignInButton({ mode, cguAccepted = true, next }: GoogleSignInButtonProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredential = useCallback(
    async (response: GsiCredentialResponse) => {
      setPending(true);
      setError(null);
      const result = await authenticateWithGoogle({
        credential: response.credential,
        mode,
        cguAccepted,
        next,
      });
      if (result.error) {
        setError(result.error);
        setPending(false);
        return;
      }
      router.push(result.redirectTo ?? "/dashboard");
    },
    [mode, cguAccepted, next, router],
  );

  useEffect(() => {
    if (!scriptReady || !clientId || !cguAccepted || !containerRef.current || !window.google) return;
    window.google.accounts.id.initialize({ client_id: clientId, callback: handleCredential, ux_mode: "popup" });
    containerRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(containerRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      locale: "fr",
      width: 320,
    });
  }, [scriptReady, clientId, cguAccepted, handleCredential]);

  if (!clientId) {
    return (
      <p className="text-xs text-text-cool" role="status">
        Connexion Google indisponible : NEXT_PUBLIC_GOOGLE_CLIENT_ID n&apos;est pas configuré.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setScriptReady(true)} />
      {cguAccepted ? (
        <div ref={containerRef} aria-busy={pending} className="min-h-[44px]" />
      ) : (
        <div
          className="flex h-11 w-80 items-center justify-center rounded border border-border bg-surface text-sm text-text-cool"
          aria-disabled="true"
        >
          Acceptez les conditions pour continuer avec Google
        </div>
      )}
      {pending && (
        <p className="text-xs text-text-cool" role="status">
          Connexion en cours…
        </p>
      )}
      {error && (
        <p className="text-sm text-warning" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
