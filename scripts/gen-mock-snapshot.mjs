// Rigenera lo snapshot locale `lib/mockData.js` dal database Notion "Places".
// Usa la STESSA normalizzazione di lib/notion.js (tenuta allineata a mano).
//
//   node scripts/gen-mock-snapshot.mjs
//
// Legge NOTION_TOKEN (e opzionale NOTION_DATABASE_ID) da .env.local.

import { Client } from "@notionhq/client";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const env = Object.fromEntries(
  readFileSync(join(ROOT, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l && !l.trim().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const TOKEN = env.NOTION_TOKEN;
const DB = env.NOTION_DATABASE_ID || "9f852898-1de5-4013-b4bd-383f93e160fd";
if (!TOKEN) {
  console.error("NOTION_TOKEN mancante in .env.local");
  process.exit(1);
}

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
  const categoria = getSelect(p["Categoria"]);
  const description = getText(p["Descrizione IT"]) || italianPart(getText(p["Descrizione"]));

  return {
    id: page.id.replace(/-/g, ""),
    name: getText(p["Nome"]),
    address,
    zone,
    type: CATEGORY_TO_TYPE[categoria] || "Altro",
    wifi: getSelect(p["WiFi"]) || null,
    prese: getSelect(p["Prese"]) || null,
    sedute: getSelect(p["Sedute"]) || null,
    rumore: getSelect(p["Rumore"]) || null,
    stayPolicy: getSelect(p["Stay Policy"]) || null,
    lat: getNumber(p["Latitude"]),
    lng: getNumber(p["Longitude"]),
    description,
    googleMaps: getUrl(p["Google Maps"]) || null,
    website: getUrl(p["Sito Web"]) || null,
    image: getUrl(p["Foto"]) || null,
    rating: getNumber(p["Rating"]),
    reviewsCount: getNumber(p["Recensioni"]),
    phone: getPhone(p["Telefono"]) || null,
    hours: parseHours(getText(p["Orari"])),
    popularTimes: parsePopularTimes(getText(p["Affollamento"])),
  };
}

const notion = new Client({ auth: TOKEN });

const pages = [];
let cursor;
do {
  const res = await notion.databases.query({ database_id: DB, start_cursor: cursor, page_size: 100 });
  pages.push(...res.results);
  cursor = res.has_more ? res.next_cursor : undefined;
} while (cursor);

const spaces = pages
  .map(normalizeSpace)
  .filter((s) => s.name && !s.name.startsWith("ELIMINARE"))
  .sort((a, b) => a.name.localeCompare(b.name, "it"));

const byType = {};
for (const s of spaces) byType[s.type] = (byType[s.type] || 0) + 1;

const today = new Date().toISOString().slice(0, 10);
const header = `// Snapshot REALE del database Notion "Places" (SAM — Study Areas Milano).
// Rigenerato il ${today} via \`node scripts/gen-mock-snapshot.mjs\`.
// Usato come fallback quando l'app non ha un NOTION_TOKEN (USE_MOCK_DATA=true).
// Lo shape rispecchia l'output di normalizeSpace() in lib/notion.js.
`;

const body =
  "export const MOCK_SPACES = [\n" +
  spaces.map((s) => JSON.stringify(s)).join(",\n") +
  "\n];\n";

writeFileSync(join(ROOT, "lib", "mockData.js"), header + "\n" + body);

console.log(`Scritti ${spaces.length} spazi in lib/mockData.js`);
for (const [t, n] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${n}\t${t}`);
}
