// Recupera le foto dei posti il cui "Sito Web" su Notion è una homepage
// condivisa con altre sedi (catene di coworking, portali universitari).
//
//   node scripts/recover-chains.mjs           # solo diagnosi (non tocca nulla)
//   node scripts/recover-chains.mjs --write   # scrive le foto trovate su Notion
//
// Dopo un --write rigenera lo snapshot: node scripts/gen-mock-snapshot.mjs
//
// PERCHÉ SERVE UNO SCRIPT A PARTE da fix-images.mjs: lì lo scraping è generico
// e parte dal "Sito Web" della riga. Per questi posti quel campo è la homepage
// della catena (regus.com, sba.unimi.it), quindi lo scraping generico darebbe
// LA STESSA foto a nove Regus diversi. Qui invece ogni famiglia di siti ha il
// suo resolver, che risale alla pagina della singola sede.
//
// Le foto trovate sono ospitate dai siti stessi: a differenza degli URL di
// Google Maps non sono link firmati a scadenza.

import { Client } from "@notionhq/client";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Alcuni host chiudono la connessione in modo sporco e undici emette l'errore
// fuori dalla catena delle promise: senza questo lo script morirebbe a metà.
process.on("uncaughtException", () => {});

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WRITE = process.argv.includes("--write");

const env = Object.fromEntries(
  readFileSync(join(ROOT, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l && !l.trim().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const TOKEN = process.env.NOTION_TOKEN || env.NOTION_TOKEN;
const DB = process.env.NOTION_DATABASE_ID || env.NOTION_DATABASE_ID || "9f852898-1de5-4013-b4bd-383f93e160fd";
if (!TOKEN) {
  console.error("NOTION_TOKEN mancante in .env.local");
  process.exit(1);
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const fetchTimeout = async (url, ms = 15000) => {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    return await fetch(url, { signal: c.signal, redirect: "follow", headers: { "User-Agent": UA } });
  } finally {
    clearTimeout(t);
  }
};

const getHtml = async (url) => {
  try {
    const r = await fetchTimeout(url);
    return r.ok ? await r.text() : null;
  } catch {
    return null;
  }
};

/** Dimensioni leggendo l'intestazione del file, per scartare loghi e banner. */
function imageSize(buf) {
  const b = Buffer.from(buf);
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b.length > 30 && b.slice(0, 4).toString() === "RIFF" && b.slice(8, 12).toString() === "WEBP") {
    const kind = b.slice(12, 16).toString();
    if (kind === "VP8X") return { w: (b.readUIntLE(24, 3) & 0xffffff) + 1, h: (b.readUIntLE(27, 3) & 0xffffff) + 1 };
    if (kind === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (kind === "VP8L") {
      const n = b.readUInt32LE(21);
      return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 };
    }
  }
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i += 1; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}

/**
 * Soglie basse di proposito: le foto delle schede universitarie sono servite a
 * 400x267 ed è la loro risoluzione originale, non una miniatura. Alzare la
 * soglia le scarterebbe lasciando passare, al loro posto, i banner delle
 * notizie che sono più grandi ma sbagliati.
 */
async function usablePhoto(url, { minBytes = 8_000, minW = 350, minH = 200 } = {}) {
  try {
    const r = await fetchTimeout(url, 12000);
    const ct = r.headers.get("content-type") || "";
    if (!r.ok || !ct.startsWith("image/") || ct.includes("svg")) return null;
    const buf = await r.arrayBuffer();
    if (buf.byteLength < minBytes) return null;
    const s = imageSize(buf);
    if (s && (s.w < minW || s.h < minH)) return null;
    return url;
  } catch {
    return null;
  }
}

/* ------------------------- Resolver: biblioteche Unimi -------------------- */

const UNIMI_BASE = "https://sba.unimi.it/it/biblioteche";

// Mappatura esplicita, non indovinata dal nome: i nomi su SAM e quelli
// ufficiali divergono parecchio ("Biblioteca BICF — Unimi Città Studi" contro
// "biblioteca-di-biologia-informatica-chimica-e-fisica-bicf"), e un match
// approssimativo qui significa mettere la foto della biblioteca sbagliata.
const UNIMI_SLUG = {
  "Biblioteca BICF — Unimi Città Studi": "biblioteca-di-biologia-informatica-chimica-e-fisica-bicf",
  "Biblioteca di Egittologia": "biblioteca-e-archivi-di-egittologia",
  "Biblioteca di Filosofia": "biblioteca-di-filosofia",
  "Biblioteca di Papirologia": "biblioteca-di-papirologia",
  "Biblioteca di Scienze dell'Antichità e Filologia Moderna": "biblioteca-di-scienze-dellantichita-e-filologia-moderna-safm",
  "Biblioteca di Scienze della Storia e della Documentazione Storica": "biblioteca-di-scienze-della-storia-e-della-documentazione-storica",
  "Biblioteca di Scienze Politiche": "biblioteca-di-scienze-politiche-enrica-collotti-pischel",
  "Biblioteca Polo Lingue — Sala di Anglistica": "biblioteca-del-polo-di-lingue-e-letterature-straniere",
  "Biblioteca Polo San Paolo": "biblioteca-di-medicina-del-polo-san-paolo",
  // Le cinque sale sono ambienti della stessa biblioteca (BSGU) e condividono
  // quindi la stessa foto dell'edificio: è corretto, ma in lista si vedranno
  // cinque schede con la stessa immagine.
  "Biblioteca di Studi Giuridici e Umanistici — Sala Centrale": "biblioteca-di-studi-giuridici-e-umanistici-bsgu",
  "Biblioteca di Studi Giuridici e Umanistici — Sala Senato (Diritto Privato e Storia del Diritto)": "biblioteca-di-studi-giuridici-e-umanistici-bsgu",
  "Biblioteca di Studi Giuridici e Umanistici — Sala del Settecento": "biblioteca-di-studi-giuridici-e-umanistici-bsgu",
  "Biblioteca di Studi Giuridici e Umanistici — Diritto del Lavoro": "biblioteca-di-studi-giuridici-e-umanistici-bsgu",
  "Biblioteca di Studi Giuridici e Umanistici — Common Law e Diritto Internazionale": "biblioteca-di-studi-giuridici-e-umanistici-bsgu",
};

const unimiImgs = (html) =>
  [...new Set([...html.matchAll(/<img[^>]*src="([^"]+)"/gi)].map((m) => m[1]))].filter((s) =>
    /\/system\/files\//.test(s)
  );

/**
 * Ogni scheda apre con la foto della biblioteca, seguita dai riquadri delle
 * notizie — che sono gli stessi su tutte le schede. Invece di elencare a mano
 * quali scartare (lista che invecchia a ogni nuova notizia), le riconosciamo
 * perché ricorrono su più schede: quelle sono di sito, non di biblioteca.
 */
async function unimiImmaginiComuni() {
  const conteggio = new Map();
  const slugs = [...new Set(Object.values(UNIMI_SLUG))];
  for (const slug of slugs) {
    const html = await getHtml(`${UNIMI_BASE}/${slug}`);
    if (!html) continue;
    for (const src of unimiImgs(html)) conteggio.set(src, (conteggio.get(src) || 0) + 1);
  }
  return new Set([...conteggio].filter(([, n]) => n >= 3).map(([src]) => src));
}

let UNIMI_COMUNI = null;

async function daUnimi(space) {
  const slug = UNIMI_SLUG[space.name];
  if (!slug) return null;
  if (!UNIMI_COMUNI) UNIMI_COMUNI = await unimiImmaginiComuni();

  const html = await getHtml(`${UNIMI_BASE}/${slug}`);
  if (!html) return null;
  for (const src of unimiImgs(html)) {
    if (UNIMI_COMUNI.has(src)) continue;
    const ok = await usablePhoto(new URL(src, "https://sba.unimi.it").href);
    if (ok) return ok;
  }
  return null;
}

/* --------------------------- Resolver: Talent Garden ---------------------- */

const TG_SLUG = {
  "Talent Garden Calabiana": "milano-calabiana",
  "Talent Garden Isola": "milano-isola",
};

async function daTalentGarden(space) {
  const slug = TG_SLUG[space.name];
  if (!slug) return null;
  const html = await getHtml(`https://talentgarden.com/it/coworking/${slug}`);
  if (!html) return null;

  // Solo le immagini che nominano la sede: il resto della pagina è materiale
  // di marca uguale per tutte le sedi (foto della home, loghi dei clienti).
  const sede = slug.replace("milano-", "");
  const candidati = [...new Set([...html.matchAll(/(?:src|data-src)="([^"]+)"/gi)].map((m) => m[1]))]
    .map((s) => s.replace(/&amp;/g, "&"))
    .filter((s) => new RegExp(sede, "i").test(decodeURIComponent(s)));

  for (const c of candidati) {
    const ok = await usablePhoto(c, { minW: 500, minH: 300 });
    if (ok) return ok;
  }
  return null;
}

/* ---------------------------------- Registro ------------------------------ */

const RESOLVER = [
  { nome: "unimi", copre: (s) => s.name in UNIMI_SLUG, risolvi: daUnimi },
  { nome: "talent-garden", copre: (s) => s.name in TG_SLUG, risolvi: daTalentGarden },
];

/* ---------------------------------- Notion -------------------------------- */

const notion = new Client({ auth: TOKEN });

const pages = [];
let cursor;
do {
  const res = await notion.databases.query({ database_id: DB, start_cursor: cursor, page_size: 100 });
  pages.push(...res.results);
  cursor = res.has_more ? res.next_cursor : undefined;
} while (cursor);

const rows = pages
  .map((p) => ({
    pageId: p.id,
    name: p.properties["Nome"]?.title?.[0]?.plain_text || "",
    foto: p.properties["Foto"]?.url || null,
  }))
  .filter((r) => r.name && !r.name.startsWith("ELIMINARE"))
  .sort((a, b) => a.name.localeCompare(b.name, "it"));

const daFare = rows.filter((r) => !r.foto && RESOLVER.some((x) => x.copre(r)));
console.log(`${rows.length} posti, ${rows.filter((r) => !r.foto).length} senza foto.`);
console.log(`Coperti da un resolver: ${daFare.length}\n`);
if (!WRITE) console.log("(diagnosi: non scrive nulla su Notion — aggiungi --write)\n");

const esiti = [];
for (const space of daFare) {
  const resolver = RESOLVER.find((x) => x.copre(space));
  const url = await resolver.risolvi(space);
  esiti.push({ ...space, url, resolver: resolver.nome });
  console.log(url ? `  ✓ ${space.name}\n      ${decodeURIComponent(url).slice(0, 100)}` : `  ✗ ${space.name} (${resolver.nome})`);
}

const trovate = esiti.filter((e) => e.url);

// Se lo stesso URL finisce su più posti va detto: è il sintomo che il resolver
// ha ripiegato su un'immagine di sito invece che sulla sede.
const perUrl = new Map();
for (const e of trovate) perUrl.set(e.url, [...(perUrl.get(e.url) || []), e.name]);
const condivise = [...perUrl].filter(([, nomi]) => nomi.length > 1);
if (condivise.length) {
  console.log("\n  Foto assegnate a più posti:");
  for (const [url, nomi] of condivise) console.log(`    ${nomi.length}× ${decodeURIComponent(url).split("/").pop().slice(0, 50)}\n       ${nomi.join(", ")}`);
}

console.log(`\n${trovate.length} foto trovate su ${daFare.length} posti.`);
writeFileSync(join(ROOT, "scripts", ".recover-chains-report.json"), JSON.stringify(esiti, null, 2));

if (!WRITE) {
  console.log("Rilancia con --write per scriverle su Notion.");
  process.exit(0);
}

let n = 0;
for (const e of trovate) {
  await notion.pages.update({ page_id: e.pageId, properties: { Foto: { url: e.url } } });
  n += 1;
  await new Promise((r) => setTimeout(r, 350)); // rate limit Notion: ~3 req/s
}
console.log(`\n${n} foto scritte. Ora rigenera lo snapshot: node scripts/gen-mock-snapshot.mjs`);
