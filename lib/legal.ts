/**
 * Constantes juridiques partagées entre la page CGU, l'inscription et le profil.
 *
 * CGU_VERSION doit changer à chaque modification substantielle des CGU :
 * la valeur est enregistrée sur le compte au moment de l'acceptation
 * (User.tosVersion) et sert de preuve. Un changement force la ré-acceptation
 * depuis la page profil.
 */
export const CGU_VERSION = "2026-09-24";

/**
 * Identité de l'éditeur — régime de l'éditeur NON PROFESSIONNEL
 * (LCEN art. 6-III-1 2°).
 *
 * ASIT est un projet pédagogique étudiant sans activité commerciale : aucune
 * personne morale ne l'édite, aucune forme juridique ni immatriculation n'est
 * donc à déclarer. La loi dispense ce régime de publier l'adresse des éditeurs ;
 * leur identité complète est communiquée à l'hébergeur, qui la conserve et ne la
 * transmet qu'à l'autorité judiciaire.
 *
 * Une personne physique qui publie est de plein droit son propre directeur de
 * publication : la désignation ci-dessous ne fait que nommer, parmi les
 * co-éditeurs, celui qui assume cette responsabilité (loi de 1982, art. 93-2).
 *
 * ⚠ À REVOIR AVANT TOUTE ACTIVITÉ COMMERCIALE (abonnement Pro, facturation).
 * Encaisser des paiements fait basculer dans le régime professionnel de
 * l'art. 6-III-1 1° : structure juridique immatriculée (association loi 1901,
 * auto-entrepreneur ou société), SIRET, adresse du siège, et le cas échéant
 * RCS, forme juridique et capital social — tous à publier ici.
 */
export const OPERATOR = {
  name: "ASIT — Architecture Studio IT",
  /** Nature de l'éditeur, affichée à la place d'une forme juridique. */
  status: "projet étudiant Epitech (EIP), édité à titre non professionnel",
  /** Co-éditeurs : personnes physiques publiant le service. */
  editors: ["Pierre-Etienne HENRY", "Ariles HARKATI", "Ewen LAYLE EVENO", "Dylan ADGHAR"],
  /** Désigné parmi les co-éditeurs ci-dessus. */
  publicationDirector: "Ariles HARKATI",
  contactEmail: "contact@asit.eu",
  privacyEmail: "privacy@asit.eu",
  host: {
    name: "OVHcloud",
    address: "2 rue Kellermann, 59100 Roubaix, France",
    phone: "+33 9 72 10 10 07",
  },
} as const;

/** Durées de conservation annoncées. Le code de purge doit les appliquer telles quelles. */
export const RETENTION = {
  inactiveAccountMonths: 24,
  securityLogsMonths: 12,
} as const;
