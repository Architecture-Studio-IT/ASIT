import type { Metadata } from "next";
import { CGU_VERSION, OPERATOR, RETENTION } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — ASIT",
  description: "Conditions générales d'utilisation, mentions légales et politique de données personnelles d'ASIT.",
};

const year = new Date().getFullYear();

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="flex flex-col gap-3">
      <h2 id={`${id}-h`} className="text-lg font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Un seul document, limité à ce que la loi impose :
 *  - mentions légales (LCEN art. 6 III-1) ;
 *  - conditions contractuelles d'utilisation du service ;
 *  - information sur les données personnelles (RGPD art. 13) ;
 *  - attribution du catalogue (Open Content License Icecat) ;
 *  - opposition à la collecte automatisée (CPI art. L.122-5-3).
 */
export default function CguPage() {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-12 text-[15px] leading-relaxed">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Conditions d&apos;utilisation</h1>
        <p className="text-sm text-text-cool">
          Version {CGU_VERSION}. Ce document regroupe les mentions légales, les conditions d&apos;utilisation du service
          ASIT et l&apos;information relative aux données personnelles.
        </p>
        <nav aria-label="Sommaire" className="mt-2">
          <ol className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-primary">
            {[
              ["editeur", "1. Éditeur et hébergeur"],
              ["service", "2. Service"],
              ["compte", "3. Compte"],
              ["usage", "4. Utilisation"],
              ["contenus", "5. Vos projets"],
              ["catalogue", "6. Catalogue"],
              ["donnees", "7. Données personnelles"],
              ["responsabilite", "8. Responsabilité"],
              ["modification", "9. Modification"],
              ["droit", "10. Droit applicable"],
            ].map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="underline-offset-2 hover:underline">
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      <Section id="editeur" title="1. Éditeur et hébergeur">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-[180px_1fr]">
          <dt className="text-text-cool">Éditeur</dt>
          <dd>
            {OPERATOR.name} — {OPERATOR.status}.
            <br />
            Co-éditeurs : {OPERATOR.editors.join(", ")}.
          </dd>
          <dt className="text-text-cool">Directeur de la publication</dt>
          <dd>{OPERATOR.publicationDirector}</dd>
          <dt className="text-text-cool">Contact</dt>
          <dd>
            <a href={`mailto:${OPERATOR.contactEmail}`} className="text-primary underline-offset-2 hover:underline">
              {OPERATOR.contactEmail}
            </a>
          </dd>
          <dt className="text-text-cool">Hébergeur</dt>
          <dd>
            {OPERATOR.host.name}, {OPERATOR.host.address}, {OPERATOR.host.phone}
          </dd>
        </dl>
        <p className="text-sm text-text-cool">
          ASIT est édité à titre non professionnel au sens de l&apos;article 6-III-1 2° de la loi pour la confiance
          dans l&apos;économie numérique : il s&apos;agit d&apos;un projet pédagogique sans activité commerciale, et
          aucune société ne l&apos;édite. À ce titre, les coordonnées personnelles des éditeurs ne sont pas publiées ;
          elles sont communiquées à l&apos;hébergeur, qui les conserve et ne les transmet qu&apos;à l&apos;autorité
          judiciaire. Toute question se pose à l&apos;adresse de contact ci-dessus.
        </p>
      </Section>

      <Section id="service" title="2. Service">
        <p>
          ASIT est un outil en ligne de conception, de configuration et d&apos;estimation budgétaire d&apos;infrastructures
          informatiques. Il fournit une aide à la décision. Il ne délivre aucune certification, aucun audit et aucun
          conseil juridique, réglementaire ou technique engageant sa responsabilité : les schémas, listes de matériel et
          estimations produits doivent être vérifiés par l&apos;utilisateur avant toute décision d&apos;achat.
        </p>
        <p>
          Le service est actuellement fourni gratuitement, sans contrepartie financière d&apos;aucune sorte. Toute
          offre payante introduite ultérieurement s&apos;accompagnera de la mise à jour des présentes et des mentions
          légales, et fera l&apos;objet de conditions particulières communiquées avant la souscription.
        </p>
      </Section>

      <Section id="compte" title="3. Compte">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            La création d&apos;un compte est nécessaire pour enregistrer des projets. Elle se fait par adresse email et
            mot de passe, ou par un compte Google.
          </li>
          <li>Vous devez être majeur ou disposer de l&apos;autorisation de votre représentant légal.</li>
          <li>Les informations fournies doivent être exactes et tenues à jour.</li>
          <li>
            Vous êtes responsable de la confidentialité de vos identifiants et de toute activité réalisée depuis votre
            compte. Signalez sans délai tout accès non autorisé à{" "}
            <a href={`mailto:${OPERATOR.contactEmail}`} className="text-primary underline-offset-2 hover:underline">
              {OPERATOR.contactEmail}
            </a>
            .
          </li>
          <li>Vous pouvez supprimer votre compte à tout moment depuis votre profil. La suppression est définitive.</li>
        </ul>
      </Section>

      <Section id="usage" title="4. Utilisation">
        <p>Il est interdit d&apos;utiliser le service pour :</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>porter atteinte à la sécurité, à l&apos;intégrité ou à la disponibilité du service ou de ses données ;</li>
          <li>accéder à des données ou à des comptes qui ne sont pas les vôtres ;</li>
          <li>publier des contenus illicites ou contraires aux droits de tiers ;</li>
          <li>contourner les mesures techniques de protection ou de limitation d&apos;accès.</li>
        </ul>
        <p className="rounded-lg border border-border bg-white p-4">
          <strong>Collecte automatisée.</strong> L&apos;extraction et la réutilisation, par tout procédé automatisé, de
          tout ou partie du catalogue et des données publiées sur ASIT sont interdites sans autorisation écrite
          préalable. Les réserves exprimées dans le fichier{" "}
          <a href="/robots.txt" className="font-mono text-primary underline-offset-2 hover:underline">
            /robots.txt
          </a>{" "}
          valent opposition au sens de l&apos;article L.122-5-3 du code de la propriété intellectuelle, y compris à
          l&apos;égard de la fouille de textes et de données.
        </p>
      </Section>

      <Section id="contenus" title="5. Vos projets">
        <p>
          Les projets que vous créez (schémas, configurations, notes) restent votre propriété. Vous nous accordez
          uniquement le droit de les héberger, sauvegarder et afficher dans la mesure nécessaire au fonctionnement du
          service. Nous ne les exploitons pas à d&apos;autres fins et ne les communiquons à aucun tiers, sauf obligation
          légale.
        </p>
      </Section>

      <Section id="catalogue" title="6. Catalogue">
        <p>
          Les fiches produits du catalogue proviennent d&apos;Icecat et sont diffusées sous l&apos;Open Content License.
          Mention obligatoire : <em>Database Right data-sheet {year} Icecat. All rights reserved.</em>
        </p>
        <p>
          Ces données sont fournies « en l&apos;état », sans garantie d&apos;aucune sorte, notamment d&apos;exactitude,
          d&apos;exhaustivité ou d&apos;actualité. Les caractéristiques peuvent avoir été reformatées ou converties pour
          les besoins du service ; la nature de ces transformations est documentée dans le dépôt du logiciel. Les
          marques et références citées appartiennent à leurs titulaires respectifs.
        </p>
        <p>
          ASIT n&apos;affiche aucun prix de son fait et ne vend rien. Les budgets sont calculés à partir des prix
          que vous saisissez dans vos projets (prix relevés, devis) et n&apos;engagent que leur source. Les liens
          vers les sites des constructeurs et des marchands sont fournis pour information ; le prix applicable est
          celui affiché sur le site tiers au moment de l&apos;achat.
        </p>
      </Section>

      <Section id="donnees" title="7. Données personnelles">
        <p>
          Responsable du traitement : {OPERATOR.name} (coordonnées à l&apos;article 1). Contact pour l&apos;exercice
          de vos droits :{" "}
          <a href={`mailto:${OPERATOR.privacyEmail}`} className="text-primary underline-offset-2 hover:underline">
            {OPERATOR.privacyEmail}
          </a>
          .
        </p>

        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full min-w-[560px] text-sm">
            <caption className="sr-only">Traitements de données personnelles</caption>
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-text-cool">
              <tr>
                <th scope="col" className="px-4 py-2">
                  Données
                </th>
                <th scope="col" className="px-4 py-2">
                  Finalité
                </th>
                <th scope="col" className="px-4 py-2">
                  Base légale
                </th>
                <th scope="col" className="px-4 py-2">
                  Conservation
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-2">Nom, adresse email, mot de passe (haché)</td>
                <td className="px-4 py-2">Création et gestion du compte</td>
                <td className="px-4 py-2">Exécution du contrat</td>
                <td className="px-4 py-2">
                  Durée du compte, puis suppression après {RETENTION.inactiveAccountMonths} mois d&apos;inactivité
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">Identifiant et photo de profil Google</td>
                <td className="px-4 py-2">Connexion par compte Google</td>
                <td className="px-4 py-2">Exécution du contrat</td>
                <td className="px-4 py-2">Durée du compte</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Projets (schémas, configurations, notes)</td>
                <td className="px-4 py-2">Fourniture du service</td>
                <td className="px-4 py-2">Exécution du contrat</td>
                <td className="px-4 py-2">Durée du compte</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Date et version d&apos;acceptation des présentes</td>
                <td className="px-4 py-2">Preuve du consentement</td>
                <td className="px-4 py-2">Obligation légale</td>
                <td className="px-4 py-2">Durée du compte</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Adresse IP, horodatage, journaux de connexion</td>
                <td className="px-4 py-2">Sécurité, détection d&apos;intrusion</td>
                <td className="px-4 py-2">Intérêt légitime</td>
                <td className="px-4 py-2">{RETENTION.securityLogsMonths} mois</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          <strong>Destinataires.</strong> Vos données sont hébergées en France par {OPERATOR.host.name}, sous-traitant
          au sens du RGPD. Lors d&apos;une connexion par Google, Google traite vos données selon sa propre politique de
          confidentialité. Aucune donnée n&apos;est vendue ni transmise à des fins publicitaires.
        </p>
        <p>
          <strong>Cookies.</strong> Le service dépose un seul cookie, strictement nécessaire à la session
          (authentification). Il ne requiert pas de consentement. Aucun cookie de mesure d&apos;audience ou publicitaire
          n&apos;est utilisé.
        </p>
        <p>
          <strong>Vos droits.</strong> Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement,
          de limitation, d&apos;opposition et de portabilité. Depuis votre profil, vous pouvez exporter vos données et
          supprimer votre compte à tout moment. Pour toute autre demande, écrivez à{" "}
          <a href={`mailto:${OPERATOR.privacyEmail}`} className="text-primary underline-offset-2 hover:underline">
            {OPERATOR.privacyEmail}
          </a>
          . Vous pouvez introduire une réclamation auprès de la CNIL (
          <a href="https://www.cnil.fr" className="text-primary underline-offset-2 hover:underline" rel="noopener noreferrer">
            cnil.fr
          </a>
          ).
        </p>
      </Section>

      <Section id="responsabilite" title="8. Responsabilité">
        <p>
          Le service est fourni « en l&apos;état ». Nous mettons en œuvre des moyens raisonnables pour en assurer la
          disponibilité et la sécurité, sans garantie d&apos;absence d&apos;interruption ou d&apos;erreur. Nous ne
          sommes pas responsables des décisions prises sur la base des estimations, schémas ou recommandations produits
          par l&apos;outil, ni des dommages indirects. Rien dans les présentes ne limite la responsabilité que la loi
          interdit de limiter.
        </p>
      </Section>

      <Section id="modification" title="9. Modification">
        <p>
          Nous pouvons modifier les présentes conditions. Chaque version porte un numéro. En cas de modification
          substantielle, la nouvelle version vous est présentée à la connexion et vous devez l&apos;accepter pour
          continuer à utiliser le service ; à défaut, vous pouvez exporter vos données et supprimer votre compte.
        </p>
      </Section>

      <Section id="droit" title="10. Droit applicable">
        <p>
          Les présentes sont soumises au droit français. En cas de litige avec un consommateur, celui-ci peut recourir
          gratuitement à un médiateur de la consommation (coordonnées communiquées sur demande à{" "}
          <a href={`mailto:${OPERATOR.contactEmail}`} className="text-primary underline-offset-2 hover:underline">
            {OPERATOR.contactEmail}
          </a>
          ) ou à la plateforme européenne de règlement en ligne des litiges. À défaut de résolution amiable, les
          tribunaux français sont compétents.
        </p>
      </Section>
    </article>
  );
}
