// Import d'offres (prix constatés) depuis un CSV — flux partenaire, export
// d'affiliation ou saisie manuelle. Le catalogue Icecat ne porte pas de prix.
//
//   npm run offers:import -- chemin/offres.csv
//
// Colonnes attendues (en-tête obligatoire, séparateur virgule ou point-virgule) :
//   manufacturer,sku,merchant,price_ht,currency,url
// price_ht en euros (12,50 ou 12.50). currency et url facultatives.
// Une ligne par couple (produit, marchand) : réimporter met le prix à jour.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");

const file = process.argv[2];
if (!file) {
  console.error("usage : npm run offers:import -- <fichier.csv>");
  process.exit(2);
}

const text = readFileSync(file, "utf8").replace(/^﻿/, "");
const sep = text.split("\n")[0].includes(";") ? ";" : ",";
const [header, ...lines] = text.split(/\r?\n/).filter((l) => l.trim());
const cols = header.split(sep).map((c) => c.trim().toLowerCase());
const idx = (name) => cols.indexOf(name);
for (const required of ["manufacturer", "sku", "merchant", "price_ht"]) {
  if (idx(required) < 0) {
    console.error(`colonne manquante : ${required}`);
    process.exit(2);
  }
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

let ok = 0, missing = 0, invalid = 0;
for (const line of lines) {
  const f = line.split(sep).map((v) => v.trim().replace(/^"|"$/g, ""));
  const manufacturer = f[idx("manufacturer")], sku = f[idx("sku")], merchant = f[idx("merchant")];
  const price = Number(String(f[idx("price_ht")]).replace(",", "."));
  const currency = idx("currency") >= 0 && f[idx("currency")] ? f[idx("currency")] : "EUR";
  const url = idx("url") >= 0 && f[idx("url")] ? f[idx("url")] : null;
  if (!manufacturer || !sku || !merchant || !Number.isFinite(price) || price <= 0) {
    invalid++;
    continue;
  }
  const product = await prisma.product.findFirst({
    where: { sku, manufacturer: { name: { equals: manufacturer, mode: "insensitive" } } },
    select: { id: true },
  });
  if (!product) {
    missing++;
    console.warn(`introuvable : ${manufacturer} ${sku}`);
    continue;
  }
  await prisma.offer.upsert({
    where: { product_id_merchant: { product_id: product.id, merchant } },
    create: { product_id: product.id, merchant, price_cents: Math.round(price * 100), currency, url },
    update: { price_cents: Math.round(price * 100), currency, url, fetched_at: new Date() },
  });
  ok++;
}
console.log(`${ok} offre(s) importée(s), ${missing} produit(s) introuvable(s), ${invalid} ligne(s) invalide(s)`);
await prisma.$disconnect();
await pool.end();
