// Controlla (e ripara) la colonna "image" della tabella Supabase "places"
// (ex property "Foto" su Notion, migrata il 2026-09-04).
//
// Perché serve: gran parte delle foto sono URL di Google Maps del tipo
// lh3.googleusercontent.com/gps-cs-s/APNQkA... — sono link firmati che dopo
// qualche mese SCADONO e iniziano a rispondere 403. Altre puntano a pagine di
// Google Maps invece che a un'immagine. Il risultato è che le card, la mappa e
// le anteprime social mostrano foto rotte.
//
//   node scripts/fix-images.mjs            # solo diagnosi (non tocca nulla)
//   node scripts/fix-images.mjs --write    # riscansiona E applica su Supabase
//   node scripts/fix-images.mjs --from-report --write   # applica l'ultima
//       diagnosi senza riscansionare (più sicuro: scrive solo ciò che hai letto)
//
// Nota: il rendering è comunque protetto lato app da components/SpaceImage.jsx,
// che nasconde le foto che non caricano. Questo script serve a tenere PULITI i
// dati, così le anteprime social (og:image) non puntano a immagini morte.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WRITE = process.argv.includes("--write");
// Applica il report dell'ultima diagnosi senza riscansionare. Serve perché una
// rete ballerina, durante una nuova scansione, può far fallire una foto che in
// diagnosi era viva: con --write verrebbe svuotata per un errore temporaneo.
// Così invece si scrive ESATTAMENTE quello che è stato letto e approvato.
const FROM_REPORT = process.argv.includes("--from-report");

// L'avanzamento va su stderr: se l'output è in pipe verso `head`/`tail` il
// canale può chiudersi prima della fine e un EPIPE non gestito interromperebbe
// lo script A METÀ delle scritture su Supabase. Meglio ignorare l'errore.
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY mancanti in .env.local");
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

/* --------------------------- Fonti di riserva ---------------------------- */

/**
 * Dimensioni di un'immagine leggendone solo l'intestazione: serve a scartare
 * loghi e icone che pesano abbastanza da superare il filtro sui byte ma sono
 * troppo piccoli per fare da foto di copertina.
 */
function imageSize(buf) {
  const b = Buffer.from(buf);
  // PNG: larghezza e altezza nei 16 byte dopo la firma.
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) {
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  }
  // WebP (VP8X / VP8L / VP8): dimensioni codificate in modo diverso per variante.
  if (b.length > 30 && b.slice(0, 4).toString() === "RIFF" && b.slice(8, 12).toString() === "WEBP") {
    const kind = b.slice(12, 16).toString();
    if (kind === "VP8X") return { w: (b.readUIntLE(24, 3) & 0xffffff) + 1, h: (b.readUIntLE(27, 3) & 0xffffff) + 1 };
    if (kind === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (kind === "VP8L") {
      const n = b.readUInt32LE(21);
      return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 };
    }
  }
  // JPEG: scorriamo i marker fino al SOF, che contiene le dimensioni.
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i += 1; continue; }
      const marker = b[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}

/**
 * Verifica che un URL sia una foto usabile come copertina: immagine vera,
 * non SVG, non minuscola. Restituisce l'URL o null.
 */
async function usablePhoto(url, { minBytes = 15_000, minW = 500, minH = 300 } = {}) {
  try {
    const r = await fetchTimeout(url, 12000);
    const ct = r.headers.get("content-type") || "";
    if (!r.ok || !ct.startsWith("image/") || ct.includes("svg")) return null;
    const buf = await r.arrayBuffer();
    if (buf.byteLength < minBytes) return null;
    const size = imageSize(buf);
    // Se il formato non è riconosciuto ci fidiamo del peso: meglio accettare
    // che scartare una foto valida in un formato esotico (AVIF, HEIC…).
    if (size && (size.w < minW || size.h < minH)) return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * Foto ufficiale delle biblioteche comunali. Ogni scheda su milano.biblioteche.it
 * ha la foto della sede in un <img class="libraryAvatar">, che NON è esposta come
 * og:image: senza questa funzione lo scraping generico non la trova.
 * Sono foto stabili e gratuite — vanno preferite alle API a pagamento.
 */
const BIBLIO_HOST = "https://milano.biblioteche.it";
const SLUG_STOPWORDS = ["biblioteca", "comunale", "rionale", "del", "della", "dello", "dei", "delle", "di", "la", "il", "lo"];

/** Possibili slug della scheda a partire dal nome del posto, dal più probabile. */
function librarySlugs(name) {
  const words = name
    .replace(/[—–-].*$/, "") // via i suffissi tipo "— Unimi Città Studi"
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const kept = words.filter((w) => !SLUG_STOPWORDS.includes(w));
  return [...new Set([kept.join(""), words.filter((w) => w !== "biblioteca").join(""), kept.join("-"), kept.at(-1)])].filter(Boolean);
}

async function fromBibliotecheMilano(row) {
  // Se il sito salvato è già la scheda giusta, quella ha la precedenza sugli
  // slug indovinati: evita di pescare la biblioteca sbagliata per nomi simili.
  const direct = row.website?.match(/^https?:\/\/milano\.biblioteche\.it\/library\/[^/]+\/?/i)?.[0];
  const candidates = direct ? [direct] : librarySlugs(row.name).map((s) => `${BIBLIO_HOST}/library/${s}/`);

  for (const pageUrl of candidates) {
    let html;
    try {
      const r = await fetchTimeout(pageUrl, 12000);
      if (!r.ok) continue;
      html = await r.text();
    } catch {
      continue;
    }
    const tag = html.match(/<img[^>]*\blibraryAvatar\b[^>]*>/i)?.[0];
    const src = tag?.match(/src\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!src) continue;
    const abs = new URL(src, BIBLIO_HOST).href;
    const ok = await usablePhoto(abs, { minBytes: 8_000, minW: 300, minH: 200 });
    if (ok) return ok;
  }
  return null;
}

/** Scarta gli <img> che non possono essere una foto del posto. */
const JUNK_IMG = /logo|icon|favicon|sprite|placeholder|avatar|badge|banner-?ad|pixel|spacer|loader|arrow|button|cookie|payment|social|whatsapp|facebook|instagram/i;
/** Percorsi che di solito contengono le foto vere del sito. */
const GOOD_PATH = /upload|media|wp-content|hero|header|gallery|slider|carousel|foto|photo|images?\//i;

/**
 * Foto dalla pagina ufficiale quando non c'è un og:image utilizzabile.
 * Molti siti di bar e coworking non hanno anteprima social ma hanno una foto
 * grande in copertina: la peschiamo dagli <img> e dai background CSS inline.
 */
function pageImageCandidates(html, base) {
  const raw = [];
  for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
    const src = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    // Nel srcset prendiamo l'ultima voce: è la variante a risoluzione più alta.
    const srcset = tag.match(/\bsrcset\s*=\s*["']([^"']+)["']/i)?.[1];
    const best = srcset?.split(",").at(-1)?.trim().split(/\s+/)[0];
    for (const s of [best, src]) if (s) raw.push(s);
  }
  for (const m of html.matchAll(/background-image\s*:\s*url\(\s*["']?([^"')]+)/gi)) raw.push(m[1]);

  const seen = new Set();
  const out = [];
  for (const s of raw) {
    if (s.startsWith("data:") || JUNK_IMG.test(s)) continue;
    let abs;
    try {
      abs = new URL(s, base).href;
    } catch {
      continue;
    }
    if (seen.has(abs)) continue;
    seen.add(abs);
    out.push(abs);
  }
  // Prima le immagini nei percorsi "da foto", mantenendo l'ordine della pagina:
  // le foto di copertina stanno quasi sempre in alto nel documento.
  return [...out.filter((u) => GOOD_PATH.test(u)), ...out.filter((u) => !GOOD_PATH.test(u))].slice(0, 12);
}

/** Foto di riserva: l'immagine social (og:image) o la copertina del sito ufficiale. */
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
    // Scarta favicon e loghi minuscoli: sotto gli 8 KB non è una foto usabile.
    const ok = await usablePhoto(abs, { minBytes: 8_000, minW: 300, minH: 200 });
    if (ok) return ok;
  }

  // Nessuna anteprima social valida: proviamo le immagini della pagina, con
  // una soglia più severa perché qui il rischio di pescare un logo è alto.
  for (const url of pageImageCandidates(html, base)) {
    const ok = await usablePhoto(url, { minBytes: 25_000, minW: 600, minH: 400 });
    if (ok) return ok;
  }
  return null;
}

/**
 * Candidati da Wikimedia Commons — SOLO come proposta da approvare a mano.
 * La ricerca è rumorosa (per "Braidense" restituisce lapidi e manoscritti):
 * finirebbero foto sbagliate sulle schede, quindi non si scrivono mai da sole.
 */
const COMMONS_JUNK = /manoscritt|codex|messale|incunabol|lapide|targa|mappa|plan of|encyclop|libro|book|page|ritratto|portrait|stemma|logo/i;

async function commonsProposals(name) {
  const u = new URL("https://commons.wikimedia.org/w/api.php");
  u.search = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `${name} Milano filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "4",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "1600",
  }).toString();

  try {
    const r = await fetchTimeout(u.href, 12000);
    if (!r.ok) return [];
    const pages = Object.values((await r.json()).query?.pages || {});
    return pages
      .filter((p) => !COMMONS_JUNK.test(p.title))
      .map((p) => ({
        title: p.title,
        url: p.imageinfo?.[0]?.thumburl?.split("?")[0],
        license: p.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value || "?",
        author: p.imageinfo?.[0]?.extmetadata?.Artist?.value?.replace(/<[^>]+>/g, "").trim() || "?",
      }))
      .filter((p) => p.url);
  } catch {
    return [];
  }
}

/* -------------------------------- Supabase -------------------------------- */

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const { data: places, error: fetchErr } = await supabase
  .from("places")
  .select("id, name, image, website, google_maps");
if (fetchErr) {
  console.error("Errore leggendo places da Supabase:", fetchErr.message);
  process.exit(1);
}

const rows = places
  .map((p) => ({
    pageId: p.id,
    name: p.name || "",
    foto: p.image || null,
    website: p.website || null,
    googleMaps: p.google_maps || null,
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "it"));

const REPORT_PATH = join(ROOT, "scripts", ".fix-images-report.json");

if (FROM_REPORT) {
  const saved = JSON.parse(readFileSync(REPORT_PATH, "utf8"));
  const current = new Map(rows.map((r) => [r.pageId, r]));
  // Salta le righe cambiate su Supabase dopo la diagnosi: applicare un report
  // vecchio sovrascriverebbe una foto messa a mano nel frattempo.
  const stale = [];
  const toApply = saved.filter((r) => {
    if (r.next === r.foto) return false;
    const now = current.get(r.pageId);
    if (!now) return false;
    if ((now.foto || null) !== (r.foto || null)) {
      stale.push(now.name);
      return false;
    }
    return true;
  });

  console.log(`Applico il report di ${new Date(statSync(REPORT_PATH).mtime).toLocaleString("it-IT")}`);
  console.log(`  ${toApply.filter((r) => r.next).length} foto da impostare`);
  console.log(`  ${toApply.filter((r) => !r.next).length} foto rotte da svuotare`);
  if (stale.length) console.log(`  ${stale.length} saltate (cambiate su Supabase dopo la diagnosi): ${stale.join(", ")}`);

  if (!WRITE) {
    console.log("\nAggiungi --write per scrivere davvero su Supabase.");
    process.exit(0);
  }

  let n = 0;
  for (const r of toApply) {
    const { error } = await supabase
      .from("places")
      .update({ image: r.next, updated_at: new Date().toISOString() })
      .eq("id", r.pageId);
    if (error) console.error(`\n  errore su ${r.name}:`, error.message);
    n += 1;
    progress(`\r  scritte ${n}/${toApply.length}`);
  }
  console.log(`\n\nFatto.`);
  process.exit(0);
}

console.log(`${rows.length} posti su Supabase — controllo le foto…\n`);

async function inspect(row) {
  const alive = row.foto ? await isLiveImage(row.foto) : false;
  if (alive) return { ...row, state: "ok", source: "esistente", next: row.foto };

  const done = (next, source) => ({
    ...row,
    state: row.foto ? "sostituita" : "aggiunta",
    source,
    next,
  });

  // Prima scelta: la foto vera nascosta in un link condiviso di Google Maps —
  // è la foto del posto, non un'immagine promozionale del sito.
  for (const link of [row.foto, row.googleMaps]) {
    const embedded = fromGoogleMapsLink(link);
    if (embedded && (await isLiveImage(embedded))) return done(embedded, "google-maps");
  }

  // Poi la scheda ufficiale del Sistema Bibliotecario: per le biblioteche è la
  // fonte migliore (foto della sede giusta) e non consuma API a pagamento.
  const biblio = await fromBibliotecheMilano(row);
  if (biblio) return done(biblio, "biblioteche-milano");

  const replacement = await fromWebsite(row.website);
  if (replacement) return done(replacement, "sito-ufficiale");

  // Nessuna fonte automatica affidabile. Cerchiamo su Wikimedia Commons dei
  // candidati da valutare a mano: non si scrivono da soli perché la ricerca
  // sbaglia spesso soggetto, ma evitano di ripartire da zero.
  const proposals = await commonsProposals(row.name);
  // Nessuna alternativa: meglio nessuna foto che una foto rotta — l'app mostra
  // il placeholder col colore/emoji della categoria e le anteprime social
  // ripiegano sull'immagine SAM di default.
  return {
    ...row,
    state: row.foto ? "svuotata" : "vuota",
    source: null,
    next: null,
    proposals,
  };
}

const report = [];
for (let i = 0; i < rows.length; i += 6) {
  report.push(...(await Promise.all(rows.slice(i, i + 6).map(inspect))));
  progress(`\r  controllati ${Math.min(i + 6, rows.length)}/${rows.length}`);
}
progress("\n\n");

const count = (s) => report.filter((r) => r.state === s).length;
console.log(`  ok         ${count("ok")}\t(foto già funzionante)`);
console.log(`  sostituita ${count("sostituita")}\t(foto rotta → nuova foto trovata)`);
console.log(`  aggiunta   ${count("aggiunta")}\t(era vuota → foto trovata)`);
console.log(`  svuotata   ${count("svuotata")}\t(foto rotta e nessuna alternativa)`);
console.log(`  vuota      ${count("vuota")}\t(nessuna foto, invariata)\n`);

const bySource = {};
for (const r of report.filter((x) => x.next && x.state !== "ok")) {
  bySource[r.source] = (bySource[r.source] || 0) + 1;
}
if (Object.keys(bySource).length) {
  console.log("  Provenienza delle foto nuove:");
  for (const [s, n] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) console.log(`    ${s}\t${n}`);
  console.log("");
}

for (const r of report.filter((x) => ["sostituita", "aggiunta", "svuotata"].includes(x.state))) {
  console.log(`  [${r.state}] ${r.name}${r.next ? `  (${r.source})\n      → ${r.next}` : ""}`);
}

// Le proposte Wikimedia restano fuori dalle modifiche automatiche: vanno lette
// e, se il soggetto è giusto, incollate a mano nella property "Foto".
const withProposals = report.filter((r) => r.proposals?.length);
if (withProposals.length) {
  console.log(`\n  ${withProposals.length} posti senza foto hanno candidati su Wikimedia Commons`);
  console.log("  (DA APPROVARE A MANO — la ricerca sbaglia spesso soggetto):\n");
  for (const r of withProposals) {
    console.log(`  ${r.name}`);
    for (const p of r.proposals) console.log(`      ${p.license.padEnd(12)} ${p.title.replace(/^File:/, "")}\n        ${p.url}`);
  }
}

writeFileSync(join(ROOT, "scripts", ".fix-images-report.json"), JSON.stringify(report, null, 2));

const changes = report.filter((r) => r.next !== r.foto);
if (!WRITE) {
  console.log(`\n${changes.length} modifiche da applicare. Rilancia con --write per scriverle su Supabase.`);
  process.exit(0);
}

console.log(`\nScrivo ${changes.length} modifiche su Supabase…`);
let done = 0;
for (const r of changes) {
  const { error } = await supabase
    .from("places")
    .update({ image: r.next, updated_at: new Date().toISOString() })
    .eq("id", r.pageId);
  if (error) console.error(`\n  errore su ${r.name}:`, error.message);
  done += 1;
  progress(`\r  ${done}/${changes.length}`);
}
console.log(`\nFatto.`);
