import type { MetadataRoute } from "next";

/**
 * Politique de collecte automatisée.
 *
 * Trois effets pour un fichier :
 *  - condition d'accès à Open Icecat (Fair Use Policy : exclure les crawlers
 *    d'entraînement IA et d'agrégation de contenu) ;
 *  - opposition à la fouille de textes et de données, exprimée par un procédé
 *    lisible par machine (dir. 2019/790 art. 4-3, CPI art. L.122-5-3) ;
 *  - démonstration de bonne foi : nous appliquons la règle dont nous réclamons
 *    le bénéfice.
 *
 * La liste des crawlers évolue : revue à chaque trimestre.
 * Dernière mise à jour : 2026-09-18.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-Web",
  "Google-Extended",
  "CCBot",
  "PerplexityBot",
  "Bytespider",
  "Amazonbot",
  "Applebot-Extended",
  "Meta-ExternalAgent",
  "Diffbot",
  "Omgilibot",
];

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard/", "/designer/", "/profile/"] },
      { userAgent: AI_CRAWLERS, disallow: "/" },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
