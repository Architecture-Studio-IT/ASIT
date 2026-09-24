/**
 * Validation d'un GTIN (EAN-8/13, UPC-A, GTIN-14) pour la recherche de prix.
 *
 * Les catalogues contiennent des codes « à circulation restreinte » — préfixes
 * GS1 200 à 299 en EAN-13, 2 et 4 en UPC-A — réservés à un usage interne
 * (distributeur, promo). Ils ne désignent rien hors de leur émetteur : une
 * recherche dessus renvoie n'importe quoi. On ne garde que les codes publics,
 * à clé de contrôle valide.
 */
export function isPublicGtin(value: string | null | undefined): value is string {
  if (!value) return false;
  const s = value.trim();
  if (!/^\d{8}$|^\d{12,14}$/.test(s)) return false;
  if (/^0+$/.test(s)) return false;

  // Circulation restreinte
  if (s.length === 13 && s.startsWith("2")) return false;
  if (s.length === 12 && (s.startsWith("2") || s.startsWith("4"))) return false;
  if (s.length === 14 && s.slice(1).startsWith("2")) return false;

  // Clé de contrôle GS1 : pondération 3/1 depuis la droite, hors dernier chiffre.
  const digits = s.split("").map(Number);
  const check = digits.pop()!;
  const sum = digits.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}
