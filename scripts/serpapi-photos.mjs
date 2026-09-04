// Riempie la colonna "image" della tabella Supabase "places" (ex property
// "Foto" su Notion, migrata il 2026-09-04) per i posti che ne sono rimasti
// senza, prendendo la foto da Google Maps tramite SerpApi.
//
//   node scripts/serpapi-photos.mjs              # solo diagnosi (non tocca nulla)
//   node scripts/serpapi-photos.mjs --write      # scrive le foto trovate su Supabase
//   node scripts/serpapi-photos.mjs --limit 20   # ferma dopo 20 posti (per provare)
//   node scripts/serpapi-photos.mjs --refresh --write   # rinnova le foto scadute
//
// IL REFRESH VA FATTO PERIODICAMENTE, ed è il prezzo di questa soluzione: gli
// URL che Google serve oggi sono firmati e scadono nel giro di settimane o
// mesi. Il piano free si rinnova ogni mese e il refresh costa una ricerca a
// posto, quindi il giro sta comodamente nella quota gratuita.
//
// PERCHÉ DUE MOTORI DIVERSI, ed è il punto centrale di questo script:
// il motore `google_maps` restituisce miniature tipo lh3.../gps-cs-s/... che
// sono link FIRMATI E TEMPORANEI — scadono dopo qualche mese con un 403, ed è
// esattamente così che le foto di SAM sono sparite. Il motore
// `google_maps_photos` restituisce invece URL lh5.../p/AF1Qip...=w1600-h1200-k-no,
// che sono stabili. Quindi la prima ricerca serve SOLO a ricavare il data_id
// del posto, e la foto si prende sempre dalla seconda.
//
// Consumo: 2 ricerche a posto. Lo script legge da /account quante ricerche
// restano e qual è il limite orario del piano (quella chiamata è gratuita), si
// dà il ritmo di conseguenza, e salva un checkpoint dopo ogni posto per
// riprendere dopo un'interruzione senza risprecare ricerche.

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WRITE = process.argv.includes("--write");
const LIMIT = Number(process.argv[process.argv.indexOf("--limit") + 1]) || Infinity;
// Rinnova le foto già impostate invece di cercarne di nuove. Costa metà delle
// ricerche perché il data_id del posto è già nel checkpoint: si salta del tutto
// la ricerca su google_maps e si rifà solo quella delle foto.
const REFRESH = process.argv.includes("--refresh");
const CHECKPOINT = join(ROOT, "scripts", ".serpapi-photos.json");

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
  console.error("Manca SERPAPI_KEY in .env.local — prendila da https://serpapi.com/manage-api-key");
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY mancanti in .env.local");
  process.exit(1);
}

/* ------------------------------ Limiti d'uso ------------------------------ */

// Il ritmo lo detta l'account, non una costante scritta a mano: i piani hanno
// limiti orari diversi e indovinarli porta o a sprecare ore di attesa inutile
// o a farsi rifiutare le chiamate. /account non consuma ricerche.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ricercheFatte = 0;

async function leggiAccount() {
  const r = await fetch(`https://serpapi.com/account?api_key=${SERP_KEY}`);
  const j = await r.json();
  if (j.error) throw new Error(`SerpApi: ${j.error}`);
  return {
    piano: j.plan_name,
    rimaste: j.total_searches_left,
    perOra: j.account_rate_limit_per_hour || 50,
  };
}

const account = await leggiAccount();
// Un margine del 20% sul limite orario: le chiamate in eccesso vengono
// rifiutate, non messe in coda, e una ricerca rifiutata è comunque persa.
const PAUSA_MS = Math.max(1000, Math.ceil((3600 / account.perOra) * 1000 * 1.2));

async function serpapi(params) {
  if (ricercheFatte > 0) {
    if (PAUSA_MS > 10_000) {
      // Con attese lunghe serve un conto alla rovescia, altrimenti sembra bloccato.
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

/* ------------------------------- Ricerca ---------------------------------- */

/** Distanza in metri, per verificare che Google abbia trovato il posto giusto. */
function distanzaM(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const l1 = (a.lat * Math.PI) / 180;
  const l2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(l1) * Math.cos(l2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * data_id del posto. La verifica sulle coordinate NON è un dettaglio: molti
 * posti di SAM sono sedi di catene (nove Regus, quattro Spaces…) e senza
 * controllo Google restituirebbe volentieri la sede sbagliata, mettendo la
 * foto di un Regus su un altro.
 */
async function trovaDataId(space) {
  const j = await serpapi({
    engine: "google_maps",
    type: "search",
    q: `${space.name} ${space.address || "Milano"}`,
    ll: "@45.4642,9.19,14z",
    hl: "it",
  });

  const candidati = j.place_results ? [j.place_results] : j.local_results || [];
  for (const c of candidati.slice(0, 5)) {
    const coord = c.gps_coordinates;
    if (!c.data_id || !coord) continue;
    if (space.lat && space.lng) {
      const d = distanzaM({ lat: space.lat, lng: space.lng }, { lat: coord.latitude, lng: coord.longitude });
      // 300 m: abbastanza da assorbire l'imprecisione del geocoding, troppo
      // poco perché passi la sede sbagliata della stessa catena.
      if (d > 300) continue;
      return { dataId: c.data_id, titolo: c.title, distanza: Math.round(d) };
    }
    return { dataId: c.data_id, titolo: c.title, distanza: null };
  }
  return null;
}

/** Un URL va bene solo se risponde 2xx E restituisce davvero un'immagine. */
async function immagineViva(url) {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 15000);
    const r = await fetch(url, { signal: c.signal });
    clearTimeout(t);
    const ct = r.headers.get("content-type") || "";
    return r.ok && ct.startsWith("image/");
  } catch {
    return false;
  }
}

/** Prima foto utilizzabile del posto, alla risoluzione più alta disponibile. */
async function trovaFoto(dataId) {
  const j = await serpapi({ engine: "google_maps_photos", data_id: dataId, hl: "it" });
  const foto = j.photos || [];
  for (const f of foto.slice(0, 3)) {
    // `image` è già la versione grande; se manca alziamo noi la risoluzione
    // della miniatura, che nel formato /p/ è solo un parametro nell'URL.
    const url = f.image || f.thumbnail?.replace(/=w\d+-h\d+/, "=w1600-h1200");
    if (url && (await immagineViva(url))) return url;
  }
  return null;
}

/* -------------------------------- Supabase --------------------------------- */

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const { data: places, error: fetchErr } = await supabase
  .from("places")
  .select("id, name, address, image, lat, lng");
if (fetchErr) {
  console.error("Errore leggendo places da Supabase:", fetchErr.message);
  process.exit(1);
}

const tutti = places
  .map((p) => ({
    pageId: p.id,
    name: p.name || "",
    address: p.address || "",
    foto: p.image || null,
    lat: p.lat ?? null,
    lng: p.lng ?? null,
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "it"));

// Il checkpoint evita di ripagare in ricerche i posti già risolti in una
// esecuzione precedente interrotta o fermata dal limite mensile.
const fatti = existsSync(CHECKPOINT) ? JSON.parse(readFileSync(CHECKPOINT, "utf8")) : {};

// In refresh guardiamo i posti che UNA foto ce l'hanno già, ma nel formato
// firmato che scade: sono gli unici che possono morire da soli. Le foto prese
// dai siti ufficiali non si toccano, non scadono.
const scadibile = (u) => !!u && /gps-cs-s/.test(u);

const daFare = (
  REFRESH
    ? tutti.filter((s) => scadibile(s.foto) && fatti[s.pageId]?.dataId)
    : tutti.filter((s) => !s.foto && !fatti[s.pageId])
).slice(0, LIMIT);

console.log(`${tutti.length} posti totali, ${tutti.filter((s) => !s.foto).length} senza foto.`);
if (REFRESH) console.log(`${tutti.filter((s) => scadibile(s.foto)).length} con foto in formato a scadenza.`);
if (Object.keys(fatti).length) console.log(`${Object.keys(fatti).length} già elaborati in una sessione precedente (checkpoint).`);
const servono = daFare.length * (REFRESH ? 1 : 2);
console.log(`Da elaborare ora: ${daFare.length} → ~${servono} ricerche SerpApi`);
console.log(`Account: ${account.piano}, ${account.rimaste} ricerche rimaste, ${account.perOra}/ora`);
console.log(`Ritmo: una ricerca ogni ${(PAUSA_MS / 1000).toFixed(1)}s → ~${Math.max(1, Math.round((servono * PAUSA_MS) / 60000))} minuti\n`);

if (servono > account.rimaste) {
  // Meglio fermarsi prima che a metà: una passata interrotta lascia una parte
  // dei posti con la foto e una parte senza, senza un motivo visibile.
  console.log(`Non bastano: servono ${servono} ricerche e ne restano ${account.rimaste}.`);
  console.log(`Usa --limit ${Math.floor(account.rimaste / 2)} per fare quello che ci sta ora.\n`);
  process.exit(1);
}
if (!WRITE) console.log("(diagnosi: non scrive nulla su Supabase — aggiungi --write)\n");

let trovate = 0;
for (const [i, space] of daFare.entries()) {
  progress(`\r[${i + 1}/${daFare.length}] ${space.name}\n`);
  try {
    // Il data_id di un posto non cambia: riusarlo è ciò che dimezza il costo
    // del refresh. È anche l'unico dato che vale la pena conservare, visto che
    // gli URL delle foto scadono comunque.
    const match = REFRESH
      ? { dataId: fatti[space.pageId].dataId, titolo: space.name, distanza: null }
      : await trovaDataId(space);
    if (!match) {
      console.log(`  ✗ ${space.name} — nessun risultato entro 300 m`);
      fatti[space.pageId] = { esito: "nessun-match" };
      writeFileSync(CHECKPOINT, JSON.stringify(fatti, null, 2));
      continue;
    }

    const url = await trovaFoto(match.dataId);
    if (!url) {
      console.log(`  ✗ ${space.name} — trovato "${match.titolo}" ma senza foto usabili`);
      fatti[space.pageId] = { esito: "senza-foto", dataId: match.dataId };
      writeFileSync(CHECKPOINT, JSON.stringify(fatti, null, 2));
      continue;
    }

    const stabile = /googleusercontent\.com\/p\//.test(url);
    console.log(`  ✓ ${space.name} — "${match.titolo}"${match.distanza !== null ? ` (${match.distanza} m)` : ""}`);
    console.log(`      ${stabile ? "URL stabile" : "ATTENZIONE: formato a scadenza"} → ${url.slice(0, 100)}`);

    if (WRITE) {
      const { error } = await supabase
        .from("places")
        .update({ image: url, updated_at: new Date().toISOString() })
        .eq("id", space.pageId);
      if (error) console.log(`      errore Supabase: ${error.message}`);
    }
    trovate += 1;
    fatti[space.pageId] = { esito: "ok", url, dataId: match.dataId };
    writeFileSync(CHECKPOINT, JSON.stringify(fatti, null, 2));
  } catch (e) {
    console.log(`  ! ${space.name} — ${e.message}`);
    // Il limite mensile non è un errore recuperabile: fermarsi qui lascia il
    // checkpoint intatto per riprendere il mese dopo.
    if (/run out|limit|quota/i.test(e.message)) {
      console.log("\nRicerche SerpApi esaurite. Il checkpoint è salvato: rilancia quando il piano si rinnova.");
      break;
    }
  }
}

console.log(`\n${trovate} foto trovate su ${daFare.length} posti (${ricercheFatte} ricerche SerpApi usate).`);
if (!WRITE) console.log("Rilancia con --write per scriverle su Supabase.");
