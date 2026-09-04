// Rigenera lo snapshot locale `lib/mockData.js` dalla tabella Supabase "places"
// (ex database Notion "Places", migrato il 2026-09-04 — vedi
// scripts/migrate-places-to-supabase.mjs). Usa la STESSA normalizzazione di
// lib/places.js (tenuta allineata a mano).
//
//   node scripts/gen-mock-snapshot.mjs
//
// Legge NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY da .env.local
// (basta l'anon key: la tabella ha RLS di sola lettura pubblica).

import { createClient } from "@supabase/supabase-js";
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

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY mancanti in .env.local");
  process.exit(1);
}

/** Converte una riga snake_case della tabella `places` nello shape usato dall'app (vedi lib/places.js). */
function normalizeRow(row) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    zone: row.zone || "",
    types: row.types && row.types.length ? row.types : ["Altro"],
    wifi: row.wifi,
    prese: row.prese,
    sedute: row.sedute,
    rumore: row.rumore,
    stayPolicy: row.stay_policy,
    ac: row.ac,
    lat: row.lat,
    lng: row.lng,
    description: row.description || "",
    descriptionEn: row.description_en,
    googleMaps: row.google_maps,
    website: row.website,
    image: row.image,
    rating: row.rating,
    reviewsCount: row.reviews_count,
    phone: row.phone,
    hours: row.hours,
    popularTimes: row.popular_times,
    accessNote: row.access_note,
    accessNoteEn: row.access_note_en,
    bookingNote: row.booking_note,
    bookingNoteEn: row.booking_note_en,
    bookingUrl: row.booking_url,
  };
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { data, error } = await supabase.from("places").select("*");
if (error) {
  console.error("Errore leggendo places da Supabase:", error.message);
  process.exit(1);
}

const spaces = data.map(normalizeRow).sort((a, b) => a.name.localeCompare(b.name, "it"));

const byType = {};
for (const s of spaces) for (const t of s.types) byType[t] = (byType[t] || 0) + 1;

const today = new Date().toISOString().slice(0, 10);
const header = `// Snapshot REALE della tabella Supabase "places" (SAM — Study Areas Milano).
// Rigenerato il ${today} via \`node scripts/gen-mock-snapshot.mjs\`.
// Usato come fallback quando l'app non ha config Supabase (USE_MOCK_DATA=true).
// Lo shape rispecchia l'output di normalizeRow() in lib/places.js.
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
