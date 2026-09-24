/**
 * Vérification de la configuration d'authentification.
 *
 * Sans AUTH_SECRET, toute création de session lève une exception : l'utilisateur
 * ne voit qu'une erreur serveur opaque. Ces contrôles permettent aux pages de
 * connexion et d'inscription d'afficher ce qui manque, plutôt que de planter.
 * Aucune valeur de secret n'est exposée, seulement le nom de la variable.
 */

export interface ConfigIssue {
  variable: string;
  problem: string;
  fix: string;
}

/** Bloquant : sans ça, aucune authentification n'est possible. */
export function authConfigIssue(): ConfigIssue | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return {
      variable: "AUTH_SECRET",
      problem: "variable absente",
      fix: "Lancez `npm run setup` pour créer un fichier .env avec un secret généré.",
    };
  }
  if (secret.length < 32) {
    return {
      variable: "AUTH_SECRET",
      problem: `trop court (${secret.length} caractères, 32 minimum)`,
      fix: "Régénérez-le avec `openssl rand -hex 32`.",
    };
  }
  return null;
}

/** Non bloquant : la connexion par mot de passe reste utilisable sans Google. */
export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
}
