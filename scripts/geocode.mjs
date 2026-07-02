// Geocoding dei posti SAM via Nominatim (OpenStreetMap), gratuito e senza chiave.
// Legge gli indirizzi da lib/mockData.js e scrive lib/coords.js con { id: [lat, lng] }.
// Rispetta il rate limit di Nominatim (max ~1 richiesta/secondo).
//
// Uso:  node scripts/geocode.mjs

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { MOCK_SPACES } from "../lib/mockData.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UA = "SAM-StudyAreasMilano/1.0 (https://github.com/Giovanni19/SAM)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Bias sull'area di Milano per evitare match sbagliati.
const VIEWBOX = "9.02,45.55,9.30,45.37"; // lon_min,lat_max,lon_max,lat_min

async function query(q) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1" +
    "&countrycodes=it&viewbox=" + VIEWBOX +
    "&q=" + encodeURIComponent(q);
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  if (!data.length) return null;
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

// Rimuove il numero civico per un tentativo più "morbido".
function streetOnly(address) {
  return address
    .replace(/,\s*\d+[A-Za-z]?(\/\w+)?/, "") // toglie ", 12" / ", 9E" / ", 2/4"
    .replace(/\s{2,}/g, " ")
    .trim();
}

const coords = {};
const failed = [];

for (let i = 0; i < MOCK_SPACES.length; i++) {
  const s = MOCK_SPACES[i];
  const attempts = [
    s.address,
    streetOnly(s.address),
    `${s.name}, Milano`,
  ];

  let result = null;
  for (const q of attempts) {
    try {
      result = await query(q);
    } catch (e) {
      console.error(`  ! errore su "${q}": ${e.message}`);
    }
    await sleep(1100); // rate limit
    if (result) break;
  }

  if (result) {
    coords[s.id] = [
      Number(result[0].toFixed(6)),
      Number(result[1].toFixed(6)),
    ];
    console.log(`[${i + 1}/${MOCK_SPACES.length}] ✓ ${s.name} -> ${coords[s.id]}`);
  } else {
    failed.push(s.name);
    console.log(`[${i + 1}/${MOCK_SPACES.length}] ✗ ${s.name} (nessun risultato)`);
  }
}

const out =
  "// Coordinate (lat, lng) dei posti, ricavate via geocoding OpenStreetMap.\n" +
  "// Rigenerabile con: node scripts/geocode.mjs\n" +
  "export const COORDS = " +
  JSON.stringify(coords, null, 2) +
  ";\n";

writeFileSync(join(__dirname, "..", "lib", "coords.js"), out);

console.log(`\nFatto. ${Object.keys(coords).length} geocodificati, ${failed.length} falliti.`);
if (failed.length) console.log("Falliti:", failed.join(", "));
