// Prépare un fichier .env utilisable à partir de .env.exemple.
//
//   npm run setup
//
// Génère AUTH_SECRET (obligatoire, 64 caractères hexadécimaux) et laisse les
// autres variables à remplir. N'écrase jamais un .env existant : il peut
// contenir des identifiants que personne ne veut perdre.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const TARGET = ".env";
const TEMPLATE = ".env.exemple";

if (existsSync(TARGET)) {
  const current = readFileSync(TARGET, "utf8");
  const secret = current.match(/^AUTH_SECRET=(.*)$/m)?.[1]?.trim() ?? "";
  if (secret.length >= 32) {
    console.log(`${TARGET} existe déjà et AUTH_SECRET est renseigné : rien à faire.`);
    process.exit(0);
  }
  const generated = randomBytes(32).toString("hex");
  const updated = /^AUTH_SECRET=/m.test(current)
    ? current.replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET=${generated}`)
    : `${current.trimEnd()}\nAUTH_SECRET=${generated}\n`;
  writeFileSync(TARGET, updated);
  console.log(`AUTH_SECRET généré dans ${TARGET} (les autres variables sont inchangées).`);
  process.exit(0);
}

if (!existsSync(TEMPLATE)) {
  console.error(`${TEMPLATE} introuvable : impossible de créer ${TARGET}.`);
  process.exit(1);
}

const content = readFileSync(TEMPLATE, "utf8").replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET=${randomBytes(32).toString("hex")}`);
writeFileSync(TARGET, content);

console.log(`${TARGET} créé depuis ${TEMPLATE}, avec un AUTH_SECRET généré.

À compléter avant de lancer l'application :
  POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB / DATABASE_URL   base de données
  RABBITMQ_*                                                       bus de messages
  GOOGLE_CLIENT_ID / NEXT_PUBLIC_GOOGLE_CLIENT_ID                  connexion Google (facultatif)
  ICECAT_USER / ICECAT_PASSWORD                                    import du catalogue (facultatif)

Sans identifiants Google, la connexion par email et mot de passe fonctionne :
le bouton Google affiche simplement qu'il n'est pas configuré.`);
