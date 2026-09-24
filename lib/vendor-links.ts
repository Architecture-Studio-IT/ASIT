/**
 * Lien « voir chez le constructeur ».
 *
 * Le catalogue ne fournit pas l'URL de la fiche constructeur : on construit un
 * lien vers la recherche du site officiel, à partir de la marque et de la
 * référence. On renvoie, on ne copie rien — un lien profond vers une page
 * publique est licite (CJUE C-466/12, Svensson). Le prix, s'il est affiché,
 * l'est chez eux ; l'utilisateur le relève lui-même dans son projet.
 *
 * Marque inconnue : recherche web sur le GTIN (identifiant mondial du produit),
 * à défaut sur « marque référence ».
 */

import { isPublicGtin } from "./gtin";

const q = encodeURIComponent;

/** Gabarits de recherche par marque (clé en minuscules, sans espaces ni ponctuation). */
const VENDOR_SEARCH: Record<string, (ref: string) => string> = {
  dell: (r) => `https://www.dell.com/fr-fr/search/${q(r)}`,
  hp: (r) => `https://www.hp.com/fr-fr/search.html#/q=${q(r)}`,
  hpe: (r) => `https://www.hpe.com/fr/fr/search-results.html?q=${q(r)}`,
  lenovo: (r) => `https://www.lenovo.com/fr/fr/search?text=${q(r)}`,
  fujitsu: (r) => `https://www.fujitsu.com/fr/search/?q=${q(r)}`,
  supermicro: (r) => `https://www.supermicro.com/fr/search?q=${q(r)}`,
  cisco: (r) => `https://www.cisco.com/c/fr_fr/search.html?query=${q(r)}`,
  tplink: (r) => `https://www.tp-link.com/fr/search/?q=${q(r)}`,
  ubiquiti: (r) => `https://eu.store.ui.com/eu/en/search?q=${q(r)}`,
  netgear: (r) => `https://www.netgear.com/fr/search/?q=${q(r)}`,
  dlink: (r) => `https://eu.dlink.com/fr/fr/search?q=${q(r)}`,
  zyxel: (r) => `https://www.zyxel.com/fr/fr/search?keys=${q(r)}`,
  alliedtelesis: (r) => `https://www.alliedtelesis.com/search?q=${q(r)}`,
  cudy: (r) => `https://www.cudy.com/search?q=${q(r)}`,
  mikrotik: (r) => `https://mikrotik.com/products?s=${q(r)}`,
  apc: (r) => `https://www.se.com/fr/fr/search/?q=${q(r)}`,
  schneiderelectric: (r) => `https://www.se.com/fr/fr/search/?q=${q(r)}`,
  eaton: (r) => `https://www.eaton.com/fr/fr-fr/search.html?q=${q(r)}`,
  cyberpower: (r) => `https://www.cyberpower.com/eu/fr/search?keyword=${q(r)}`,
  synology: (r) => `https://www.synology.com/fr-fr/search?query=${q(r)}`,
  qnap: (r) => `https://www.qnap.com/fr-fr/search?q=${q(r)}`,
  logitech: (r) => `https://www.logitech.com/fr-fr/search.html?q=${q(r)}`,
  samsung: (r) => `https://www.samsung.com/fr/search/?searchvalue=${q(r)}`,
  lg: (r) => `https://www.lg.com/fr/search?search=${q(r)}`,
  aoc: (r) => `https://eu.aoc.com/fr/search?q=${q(r)}`,
  benq: (r) => `https://www.benq.eu/fr-fr/search.html?q=${q(r)}`,
  iiyama: (r) => `https://iiyama.com/fr_fr/search/?q=${q(r)}`,
  philips: (r) => `https://www.philips.fr/c-w/search.html#q=${q(r)}`,
  asus: (r) => `https://www.asus.com/fr/search/?q=${q(r)}`,
  acer: (r) => `https://www.acer.com/fr-fr/search?query=${q(r)}`,
  brother: (r) => `https://www.brother.fr/recherche?q=${q(r)}`,
  canon: (r) => `https://www.canon.fr/search/?q=${q(r)}`,
  epson: (r) => `https://www.epson.fr/fr_FR/search/?text=${q(r)}`,
  kyocera: (r) => `https://www.kyoceradocumentsolutions.fr/fr/recherche.html?q=${q(r)}`,
  xerox: (r) => `https://www.xerox.fr/fr-fr/recherche?q=${q(r)}`,
};

function vendorKey(brand: string): string {
  return brand
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export interface VendorLink {
  url: string;
  /** « Dell » si le site constructeur est connu, sinon « recherche web ». */
  label: string;
  official: boolean;
}

export function vendorLink(brand: string, model: string | null, sku: string, gtin: string | null): VendorLink {
  const ref = (model ?? sku).trim();
  const build = VENDOR_SEARCH[vendorKey(brand)];
  if (build && ref) {
    return { url: build(ref), label: brand, official: true };
  }
  const query = isPublicGtin(gtin) ? gtin : `${brand} ${ref}`;
  return { url: `https://duckduckgo.com/?q=${q(query)}`, label: "recherche web", official: false };
}

/**
 * Liens de comparaison de prix, tous vers des pages publiques ouvertes dans un
 * nouvel onglet : l'utilisateur lit le prix chez eux et le relève dans son
 * projet. Aucun résultat n'est récupéré ni affiché par ASIT — ce serait de
 * l'extraction (et, pour Google, une violation de leurs conditions).
 *
 * Google Shopping et idealo par GTIN quand il existe : la recherche tombe sur
 * le produit exact plutôt que sur un libellé approchant.
 */
export function priceSearchLinks(brand: string, model: string | null, sku: string, gtin: string | null): VendorLink[] {
  const ref = (model ?? sku).trim();
  // GTIN public uniquement : un code interne (préfixe 2xx) renvoie des résultats sans rapport.
  const query = isPublicGtin(gtin) ? gtin : `${brand} ${ref}`;
  const vendor = vendorLink(brand, model, sku, gtin);
  return [
    { url: `https://www.google.com/search?tbm=shop&hl=fr&gl=fr&q=${q(query)}`, label: "Google Shopping", official: false },
    { url: `https://www.idealo.fr/prix/resultat.html?q=${q(query)}`, label: "idealo", official: false },
    ...(vendor.official ? [vendor] : []),
  ];
}
