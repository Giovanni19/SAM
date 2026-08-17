// Controlla (e ripara) la property "Foto" del database Notion "Places".
//
// Perché serve: gran parte delle foto sono URL di Google Maps del tipo
// lh3.googleusercontent.com/gps-cs-s/APNQkA... — sono link firmati che dopo
// qualche mese SCADONO e iniziano a rispondere 403. Altre puntano a pagine di
// Google Maps invece che a un'immagine. Il risultato è che le card, la mappa e
// le anteprime social mostrano foto rotte.
//
//   node scripts/fix-images.mjs            # solo diagnosi (non tocca nulla)
//   node scripts/fix-images.mjs --write    # applica le correzioni su Notion
//
// Dopo un --write conviene rigenerare lo snapshot locale:
//   node scripts/gen-mock-snapshot.mjs
//
// Nota: il rendering è comunque protetto lato app da components/SpaceImage.jsx,
// che nasconde le foto che non caricano. Questo script serve a tenere PULITI i
// dati, così le anteprime social (og:image) non puntano a immagini morte.

import { Client } from "@notionhq/client";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WRITE = process.argv.includes("--write");

// L'avanzamento va su stderr: se l'output è in pipe verso `head`/`tail` il
// canale può chiudersi prima della fine e un EPIPE non gestito interromperebbe
// lo script A METÀ delle scritture su Notion. Meglio ignorare l'errore.
process.stderr.on("error", () => {});
process.stdout.on("error", () => {});
const progress = (text) => {
  try {
    process.stderr.write(text);
  } catch {
    /* pipe chiusa: l'avanzamento non è essenziale */
  }
};

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

/** Un URL va bene solo se risponde 2xx E restituisce davvero un'immagine. */
async function isLiveImage(url) {
  try {
    const r = await fetchTimeout(url, 12000);
    const ct = r.headers.get("content-type") || "";
    return r.ok && ct.startsWith("image/");
  } catch {
    return false;
  }
}

/**
 * Un link "condividi" di Google Maps non è un'immagine, ma se la condivisione
 * partiva da una foto contiene il vero URL diretto dentro il parametro `!6s`,
 * URL-encoded. Lo estraiamo e alziamo la risoluzione richiesta.
 */
function fromGoogleMapsLink(url) {
  if (!url) return null;
  const m = url.match(/!6s([^!]+)/);
  if (!m) return null;
  let photo;
  try {
    photo = decodeURIComponent(m[1]);
  } catch {
    return null;
  }
  if (!/^https:\/\/lh3\.googleusercontent\.com\//.test(photo)) return null;
  return photo.replace(/=w\d+-h\d+/, "=w1600-h1200");
}

/** Foto di riserva: l'immagine social (og:image) dal sito ufficiale del posto. */
async function fromWebsite(website) {
  if (!website) return null;
  let html, base;
  try {
    const r = await fetchTimeout(website);
    if (!r.ok) return null;
    base = r.url;
    html = (await r.text()).slice(0, 400_000);
  } catch {
    return null;
  }

  const prefer = ["og:image", "og:image:secure_url", "twitter:image", "twitter:image:src"];
  const found = [];
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const key = tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    const content = tag.match(/content\s*=\s*["']([^"']+)["']/i)?.[1];
    if (key && content && prefer.includes(key)) found.push({ rank: prefer.indexOf(key), content });
  }
  found.sort((a, b) => a.rank - b.rank);

  for (const { content } of found) {
    let abs;
    try {
      abs = new URL(content, base).href;
    } catch {
      continue;
    }
    try {
      const r = await fetchTimeout(abs, 12000);
      const ct = r.headers.get("content-type") || "";
      if (!r.ok || !ct.startsWith("image/") || ct.includes("svg")) continue;
      // Scarta favicon e loghi minuscoli: sotto gli 8 KB non è una foto usabile.
      const bytes = (await r.arrayBuffer()).byteLength;
      if (bytes < 8_000) continue;
      return abs;
    } catch {
      /* prova il candidato successivo */
    }
  }
  return null;
}

/* --------------------------------- Notion --------------------------------- */

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
    website: p.properties["Sito Web"]?.url || null,
    googleMaps: p.properties["Google Maps"]?.url || null,
  }))
  .filter((r) => r.name && !r.name.startsWith("ELIMINARE"))
  .sort((a, b) => a.name.localeCompare(b.name, "it"));

console.log(`${rows.length} posti su Notion — controllo le foto…\n`);

async function inspect(row) {
  const alive = row.foto ? await isLiveImage(row.foto) : false;
  if (alive) return { ...row, state: "ok", next: row.foto };

  // Prima scelta: la foto vera nascosta in un link condiviso di Google Maps —
  // è la foto del posto, non un'immagine promozionale del sito.
  for (const link of [row.foto, row.googleMaps]) {
    const embedded = fromGoogleMapsLink(link);
    if (embedded && (await isLiveImage(embedded))) {
      return { ...row, state: row.foto ? "sostituita" : "aggiunta", next: embedded };
    }
  }

  const replacement = await fromWebsite(row.website);
  if (replacement) return { ...row, state: row.foto ? "sostituita" : "aggiunta", next: replacement };
  // Nessuna alternativa: meglio nessuna foto che una foto rotta — l'app mostra
  // il placeholder col colore/emoji della categoria e le anteprime social
  // ripiegano sull'immagine SAM di default.
  return { ...row, state: row.foto ? "svuotata" : "vuota", next: null };
}

const report = [];
for (let i = 0; i < rows.length; i += 6) {
  report.push(...(await Promise.all(rows.slice(i, i + 6).map(inspect))));
  progress(`\r  controllati ${Math.min(i + 6, rows.length)}/${rows.length}`);
}
progress("\n\n");

const count = (s) => report.filter((r) => r.state === s).length;
console.log(`  ok         ${count("ok")}\t(foto già funzionante)`);
console.log(`  sostituita ${count("sostituita")}\t(foto rotta → foto dal sito ufficiale)`);
console.log(`  aggiunta   ${count("aggiunta")}\t(era vuota → foto dal sito ufficiale)`);
console.log(`  svuotata   ${count("svuotata")}\t(foto rotta e nessuna alternativa)`);
console.log(`  vuota      ${count("vuota")}\t(nessuna foto, invariata)\n`);

for (const r of report.filter((x) => ["sostituita", "aggiunta", "svuotata"].includes(x.state))) {
  console.log(`  [${r.state}] ${r.name}${r.next ? `\n      → ${r.next}` : ""}`);
}

writeFileSync(join(ROOT, "scripts", ".fix-images-report.json"), JSON.stringify(report, null, 2));

const changes = report.filter((r) => r.next !== r.foto);
if (!WRITE) {
  console.log(`\n${changes.length} modifiche da applicare. Rilancia con --write per scriverle su Notion.`);
  process.exit(0);
}

console.log(`\nScrivo ${changes.length} modifiche su Notion…`);
let done = 0;
for (const r of changes) {
  await notion.pages.update({ page_id: r.pageId, properties: { Foto: { url: r.next } } });
  done += 1;
  progress(`\r  ${done}/${changes.length}`);
  await new Promise((res) => setTimeout(res, 350)); // rate limit Notion: ~3 req/s
}
console.log(`\nFatto. Ora rigenera lo snapshot: node scripts/gen-mock-snapshot.mjs`);
