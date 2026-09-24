import type { ConfigIssue } from "@/lib/env";

/**
 * Affiché à la place du formulaire quand l'authentification n'est pas
 * configurée : sans ce garde-fou, la première inscription renvoie une erreur
 * serveur opaque et la cause n'apparaît que dans les logs.
 */
export default function ConfigNotice({ issue }: { issue: ConfigIssue }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-xl border border-warning/50 bg-warning/5 p-5">
      <h2 className="text-base font-semibold">Authentification non configurée</h2>
      <p className="text-sm">
        La variable d&apos;environnement <code className="font-mono">{issue.variable}</code> est {issue.problem}.
        Tant qu&apos;elle n&apos;est pas renseignée, aucun compte ne peut être créé ni utilisé.
      </p>
      <p className="text-sm">{issue.fix}</p>
      <p className="text-xs text-text-cool">
        Puis redémarrez l&apos;application. Les détails de configuration sont dans le README du projet.
      </p>
    </div>
  );
}
