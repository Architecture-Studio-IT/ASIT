import { OAuth2Client } from "google-auth-library";

/**
 * Vérification d'un jeton d'identité Google (« credential » renvoyé par
 * Google Identity Services côté navigateur) avec la bibliothèque officielle.
 *
 * verifyIdToken contrôle la signature contre les clés publiques Google,
 * l'émetteur, l'expiration et l'audience (notre client ID).
 */

const client = new OAuth2Client();

export type GoogleIdentity = {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
};

export async function verifyGoogleCredential(credential: string): Promise<GoogleIdentity> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID manquant");

  const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email) {
    throw new Error("Jeton Google incomplet");
  }
  if (!payload.email_verified) {
    throw new Error("Adresse Google non vérifiée");
  }

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name ?? null,
    picture: payload.picture ?? null,
  };
}
