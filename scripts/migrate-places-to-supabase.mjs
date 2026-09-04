// Migrazione una tantum: legge tutti i posti dal database Notion "Places" e
// li scrive nella tabella Supabase `places` (stessa normalizzazione di
// lib/notion.js, duplicata qui come già fa gen-mock-snapshot.mjs, per
// restare uno script standalone senza dipendere da moduli server-only di
// Next.js).
//
//   node --env-file=.env.local scripts/migrate-places-to-supabase.mjs --dry-run
//   node --env-file=.env.local scripts/migrate-places-to-supabase.mjs
//
// Richiede NOTION_TOKEN, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// in .env.local (la service-role key bypassa la RLS, necessaria per scrivere).

import { Client } from "@notionhq/client";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DRY_RUN = process.argv.includes("--dry-run");

const env = Object.fromEntries(
  readFileSync(join(ROOT, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l && !l.trim().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const NOTION_TOKEN = env.NOTION_TOKEN;
const NOTION_DB = env.NOTION_DATABASE_ID || "9f852898-1de5-4013-b4bd-383f93e160fd";
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!NOTION_TOKEN) { console.error("NOTION_TOKEN mancante in .env.local"); process.exit(1); }
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY mancanti in .env.local");
  process.exit(1);
}

/* ---------- normalizzazione Notion (allineata a lib/notion.js) ---------- */

const CATEGORY_TO_TYPE = {
  cafe: "Caffetteria",
  library: "Biblioteca",
  coworking: "Coworking",
  bookstore: "Libreria",
};

const CAP_TO_ZONE = {
  20121: "Brera / Garibaldi", 20122: "Centro", 20123: "Centro", 20124: "Porta Venezia",
  20125: "Bicocca", 20126: "Bicocca", 20127: "Loreto / NoLo", 20129: "Città Studi",
  20131: "Città Studi", 20133: "Città Studi", 20135: "Porta Romana", 20136: "Bocconi",
  20137: "Porta Romana", 20139: "Corvetto", 20141: "Vigentino / Chiesa Rossa",
  20142: "Barona", 20143: "Navigli", 20144: "Tortona / Porta Genova", 20146: "Giambellino",
  20151: "Gallaratese", 20154: "Sempione / Sarpi", 20158: "Bovisa", 20159: "Isola",
};

function deriveZoneFromAddress(address) {
  if (!address) return "";
  const cap = address.match(/\b(201\d\d)\b/);
  return (cap && CAP_TO_ZONE[cap[1]]) || "";
}

const getText = (p) => p?.title?.[0]?.plain_text || p?.rich_text?.[0]?.plain_text || "";
const getSelect = (p) => p?.select?.name || "";
const getMultiSelect = (p) => p?.multi_select?.map((o) => o.name) || [];
const getNumber = (p) => (typeof p?.number === "number" ? p.number : null);
const getUrl = (p) => p?.url || "";
const getPhone = (p) => p?.phone_number || "";

function parseHours(text) {
  if (!text) return null;
  const map = { Lun: "mon", Mar: "tue", Mer: "wed", Gio: "thu", Ven: "fri", Sab: "sat", Dom: "sun" };
  const out = {};
  for (const part of text.split("|")) {
    const [label, ...rest] = part.trim().split(":");
    const key = map[label?.trim()];
    if (key) out[key] = rest.join(":").trim();
  }
  return Object.keys(out).length ? out : null;
}
function parsePopularTimes(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
function italianPart(text) {
  if (!text) return "";
  return text.split(" / ")[0].trim();
}

function normalizeSpace(page) {
  const p = page.properties || {};
  const address = getText(p["Indirizzo"]);
  const zone = getSelect(p["Zona"]) || deriveZoneFromAddress(address);
  const categorie = getMultiSelect(p["Categoria"]);
  const types = [...new Set(categorie.map((c) => CATEGORY_TO_TYPE[c] || "Altro"))];
  const description = getText(p["Descrizione IT"]) || italianPart(getText(p["Descrizione"]));
  const descriptionEn = getText(p["Descrizione EN"]);

  return {
    id: page.id.replace(/-/g, ""),
    name: getText(p["Nome"]),
    address,
    zone,
    types: types.length ? types : ["Altro"],
    wifi: getSelect(p["WiFi"]) || null,
    prese: getSelect(p["Prese"]) || null,
    sedute: getSelect(p["Sedute"]) || null,
    rumore: getSelect(p["Rumore"]) || null,
    stayPolicy: getSelect(p["Stay Policy"]) || null,
    ac: getSelect(p["Aria Condizionata"]) || null,
    lat: getNumber(p["Latitude"]),
    lng: getNumber(p["Longitude"]),
    description,
    descriptionEn: descriptionEn || null,
    googleMaps: getUrl(p["Google Maps"]) || null,
    website: getUrl(p["Sito Web"]) || null,
    image: getUrl(p["Foto"]) || null,
    rating: getNumber(p["Rating"]),
    reviewsCount: getNumber(p["Recensioni"]),
    phone: getPhone(p["Telefono"]) || null,
    hours: parseHours(getText(p["Orari"])),
    popularTimes: parsePopularTimes(getText(p["Affollamento"])),
    accessNote: getText(p["Note Accesso"]) || null,
    accessNoteEn: getText(p["Note Accesso EN"]) || null,
    bookingNote: getText(p["Note Prenotazione"]) || null,
    bookingNoteEn: getText(p["Note Prenotazione EN"]) || null,
    bookingUrl: getUrl(p["Prenotazione URL"]) || null,
  };
}

/** camelCase (shape app) -> snake_case (colonne places) */
function toRow(s) {
  return {
    id: s.id,
    name: s.name,
    address: s.address || null,
    zone: s.zone || null,
    types: s.types,
    wifi: s.wifi,
    prese: s.prese,
    sedute: s.sedute,
    rumore: s.rumore,
    stay_policy: s.stayPolicy,
    ac: s.ac,
    lat: s.lat,
    lng: s.lng,
    description: s.description || null,
    description_en: s.descriptionEn,
    google_maps: s.googleMaps,
    website: s.website,
    image: s.image,
    rating: s.rating,
    reviews_count: s.reviewsCount,
    phone: s.phone,
    hours: s.hours,
    popular_times: s.popularTimes,
    access_note: s.accessNote,
    access_note_en: s.accessNoteEn,
    booking_note: s.bookingNote,
    booking_note_en: s.bookingNoteEn,
    booking_url: s.bookingUrl,
    updated_at: new Date().toISOString(),
  };
}

/* ---------------------------------- main --------------------------------- */

const notion = new Client({ auth: NOTION_TOKEN });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log(`Leggo il database Notion ${NOTION_DB}...`);
const pages = [];
let cursor;
do {
  const res = await notion.databases.query({ database_id: NOTION_DB, start_cursor: cursor, page_size: 100 });
  pages.push(...res.results);
  cursor = res.has_more ? res.next_cursor : undefined;
} while (cursor);

const spaces = pages
  .map(normalizeSpace)
  .filter((s) => s.name && !s.name.startsWith("ELIMINARE"))
  .sort((a, b) => a.name.localeCompare(b.name, "it"));

console.log(`${pages.length} pagine Notion, ${spaces.length} da migrare (esclusi vuoti/ELIMINARE).`);

const rows = spaces.map(toRow);

if (DRY_RUN) {
  console.log("\n--dry-run: nessuna scrittura. Esempio delle prime 3 righe:");
  console.log(JSON.stringify(rows.slice(0, 3), null, 2));
  console.log(`\nTotale righe pronte per l'upsert: ${rows.length}`);
  process.exit(0);
}

const BATCH = 50;
let written = 0;
const errors = [];
for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);
  const { error } = await supabase.from("places").upsert(batch, { onConflict: "id" });
  if (error) {
    errors.push({ batch: i / BATCH, error: error.message });
    console.error(`Batch ${i / BATCH} FALLITO:`, error.message);
  } else {
    written += batch.length;
    console.log(`Batch ${i / BATCH}: scritte ${batch.length} righe (${written}/${rows.length})`);
  }
}

console.log(`\nCompletato: ${written}/${rows.length} righe scritte su Supabase.`);
if (errors.length) {
  console.error(`${errors.length} batch falliti:`, errors);
  process.exit(1);
}
