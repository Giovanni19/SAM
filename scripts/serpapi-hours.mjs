// Riempie la colonna "hours" della tabella Supabase "places" per i posti che
// ne sono rimasti senza, prendendo gli orari da Google Maps tramite SerpApi.
//
//   node scripts/serpapi-hours.mjs              # solo diagnosi (non tocca nulla)
//   node scripts/serpapi-hours.mjs --write      # scrive gli orari trovati su Supabase
//   node scripts/serpapi-hours.mjs --limit 20   # ferma dopo 20 posti (per provare)
//
// Un solo motore (google_maps) e una sola ricerca a posto: il campo "hours"
// del place_results contiene già gli orari settimana per settimana, non serve
// il secondo giro (google_maps_photos) che usa serpapi-photos.mjs.
//
// Stesso controllo di distanza (300 m) di serpapi-photos.mjs: molti posti sono
// sedi di catene (Regus, WeWork, Spaces...) e senza verifica sulle coordinate
// Google potrebbe restituire gli orari della sede sbagliata.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WRITE = process.argv.includes("--write");
const LIMIT = Number(process.argv[process.argv.indexOf("--limit") + 1]) || Infinity;

process.stderr.on("error", () => {});
process.stdout.on("error", () => {});
const progress = (t) => {
  try {
    process.stderr.write(t);
  } catch {
    /* pipe chiusa */
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

const SERP_KEY = process.env.SERPAPI_KEY || env.SERPAPI_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERP_KEY) {
  console.error("Manca SERPAPI_KEY in .env.local");
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY mancanti in .env.local");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ricercheFatte = 0;

async function leggiAccount() {
  const r = await fetch(`https://serpapi.com/account?api_key=${SERP_KEY}`);
  const j = await r.json();
  if (j.error) throw new Error(`SerpApi: ${j.error}`);
  return { piano: j.plan_name, rimaste: j.total_searches_left, perOra: j.account_rate_limit_per_hour || 50 };
}

const account = await leggiAccount();
const PAUSA_MS = Math.max(1000, Math.ceil((3600 / account.perOra) * 1000 * 1.2));

async function serpapi(params) {
  if (ricercheFatte > 0) {
    if (PAUSA_MS > 10_000) {
      for (let s = Math.round(PAUSA_MS / 1000); s > 0; s -= 5) {
        progress(`\r  attesa limite SerpApi: ${s}s   `);
        await sleep(5000);
      }
      progress("\r                                   \r");
    } else {
      await sleep(PAUSA_MS);
    }
  }
  const url = new URL("https://serpapi.com/search.json");
  for (const [k, v] of Object.entries({ ...params, api_key: SERP_KEY })) url.searchParams.set(k, v);
  ricercheFatte += 1;
  const r = await fetch(url);
  const j = await r.json();
  if (j.error) throw new Error(`SerpApi: ${j.error}`);
  return j;
}

function distanzaM(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const l1 = (a.lat * Math.PI) / 180;
  const l2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(l1) * Math.cos(l2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const DAY_MAP = {
  monday: "mon", tuesday: "tue", wednesday: "wed", thursday: "thu",
  friday: "fri", saturday: "sat", sunday: "sun",
};

/**
 * Cerca il posto su Google Maps e restituisce gli orari, verificando la
 * distanza. IMPORTANTE: la query usa solo nome + "Milano", MAI l'indirizzo
 * completo — con l'indirizzo Google risponde con una lista `local_results`
 * generica il cui campo `hours` è una riga di stato tipo "Closed · Opens 10
 * AM Sat" (stringa), non l'orario settimanale. Solo `place_results` (la
 * scheda a singolo posto, che compare quando la query è abbastanza specifica
 * da individuare un solo luogo) restituisce l'array giorno-per-giorno.
 */
async function trovaOrari(space) {
  const j = await serpapi({
    engine: "google_maps",
    type: "search",
    q: `${space.name} Milano`,
    ll: "@45.4642,9.19,14z",
    hl: "en",
  });

  const candidati = j.place_results ? [j.place_results] : j.local_results || [];
  for (const c of candidati.slice(0, 5)) {
    const coord = c.gps_coordinates;
    if (!coord || !Array.isArray(c.hours)) continue;
    if (space.lat && space.lng) {
      const d = distanzaM({ lat: space.lat, lng: space.lng }, { lat: coord.latitude, lng: coord.longitude });
      if (d > 300) continue;
      return { hours: c.hours, titolo: c.title, distanza: Math.round(d) };
    }
    return { hours: c.hours, titolo: c.title, distanza: null };
  }
  return null;
}

function toHoursObject(rawHours) {
  const out = {};
  for (const entry of rawHours) {
    for (const [day, value] of Object.entries(entry)) {
      const key = DAY_MAP[day.toLowerCase()];
      if (key) out[key] = value;
    }
  }
  return Object.keys(out).length ? out : null;
}

/* -------------------------------- Supabase --------------------------------- */

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const { data: places, error: fetchErr } = await supabase
  .from("places")
  .select("id, name, address, hours, lat, lng");
if (fetchErr) {
  console.error("Errore leggendo places da Supabase:", fetchErr.message);
  process.exit(1);
}

const rows = places
  .map((p) => ({ pageId: p.id, name: p.name || "", address: p.address || "", hours: p.hours, lat: p.lat, lng: p.lng }))
  .sort((a, b) => a.name.localeCompare(b.name, "it"));

const daFare = rows.filter((r) => !r.hours).slice(0, LIMIT);

console.log(`${rows.length} posti totali, ${rows.filter((r) => !r.hours).length} senza orari.`);
console.log(`Da elaborare ora: ${daFare.length} → ~${daFare.length} ricerche SerpApi`);
console.log(`Account: ${account.piano}, ${account.rimaste} ricerche rimaste, ${account.perOra}/ora`);
console.log(`Ritmo: una ricerca ogni ${(PAUSA_MS / 1000).toFixed(1)}s → ~${Math.max(1, Math.round((daFare.length * PAUSA_MS) / 60000))} minuti\n`);

if (daFare.length > account.rimaste) {
  console.log(`Non bastano: servono ${daFare.length} ricerche e ne restano ${account.rimaste}.`);
  console.log(`Usa --limit ${account.rimaste} per fare quello che ci sta ora.\n`);
  process.exit(1);
}
if (!WRITE) console.log("(diagnosi: non scrive nulla su Supabase — aggiungi --write)\n");

let trovati = 0;
for (const [i, space] of daFare.entries()) {
  progress(`\r[${i + 1}/${daFare.length}] ${space.name}\n`);
  try {
    const match = await trovaOrari(space);
    if (!match) {
      console.log(`  ✗ ${space.name} — nessun risultato con orari entro 300 m`);
      continue;
    }
    const hoursObj = toHoursObject(match.hours);
    if (!hoursObj) {
      console.log(`  ✗ ${space.name} — trovato "${match.titolo}" ma senza orari validi`);
      continue;
    }
    console.log(`  ✓ ${space.name} — "${match.titolo}"${match.distanza !== null ? ` (${match.distanza} m)` : ""}`);
    console.log(`      ${Object.entries(hoursObj).map(([d, v]) => `${d}: ${v}`).join(" | ")}`);

    if (WRITE) {
      const { error } = await supabase
        .from("places")
        .update({ hours: hoursObj, updated_at: new Date().toISOString() })
        .eq("id", space.pageId);
      if (error) console.log(`      errore Supabase: ${error.message}`);
    }
    trovati += 1;
  } catch (e) {
    console.log(`  ! ${space.name} — ${e.message}`);
    if (/run out|limit|quota/i.test(e.message)) {
      console.log("\nRicerche SerpApi esaurite.");
      break;
    }
  }
}

console.log(`\n${trovati} orari trovati su ${daFare.length} posti (${ricercheFatte} ricerche SerpApi usate).`);
if (!WRITE) console.log("Rilancia con --write per scriverli su Supabase.");
