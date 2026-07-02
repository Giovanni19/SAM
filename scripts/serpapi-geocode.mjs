// Ri-verifica lat/lng di ogni posto SAM via SerpApi (Google Maps engine),
// più affidabile di Nominatim/OSM per matching di attività commerciali.
// Uso: SERPAPI_KEY=xxx node serpapi-geocode.mjs (chiave letta da .env.local o dall'ambiente — mai committata qui)
import fs from "node:fs";

const MOCK_PATH =
  "/Users/svevamorini/Library/Mobile Documents/com~apple~CloudDocs/SAM/lib/mockData.js";

const API_KEY = process.env.SERPAPI_KEY;
if (!API_KEY) {
  console.error("Manca SERPAPI_KEY nell'ambiente.");
  process.exit(1);
}

const raw = fs.readFileSync(MOCK_PATH, "utf8");
const arrLiteral = raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1);
const MOCK_SPACES = new Function(`return ${arrLiteral};`)();

console.error(`Loaded ${MOCK_SPACES.length} spaces.`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function searchPlace(query) {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_maps");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "search");
  url.searchParams.set("ll", "@45.4642,9.19,12z"); // centro Milano, per disambiguare
  url.searchParams.set("api_key", API_KEY);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  if (data.place_results?.gps_coordinates) {
    const g = data.place_results.gps_coordinates;
    return { lat: g.latitude, lng: g.longitude, title: data.place_results.title, source: "place_results" };
  }
  const first = data.local_results?.[0];
  if (first?.gps_coordinates) {
    return {
      lat: first.gps_coordinates.latitude,
      lng: first.gps_coordinates.longitude,
      title: first.title,
      source: "local_results[0]",
    };
  }
  return null;
}

const results = [];
for (const [i, s] of MOCK_SPACES.entries()) {
  let hit = null;
  try {
    hit = await searchPlace(`${s.name}, ${s.address}`);
  } catch (e) {
    console.error(`ERR ${s.name}: ${e.message}`);
  }

  const oldPos = [s.lat, s.lng];
  const newPos = hit ? [hit.lat, hit.lng] : null;
  const distKm = newPos ? haversineKm(oldPos, newPos) : null;

  results.push({
    id: s.id,
    name: s.name,
    address: s.address,
    old: { lat: s.lat, lng: s.lng },
    new: hit ? { lat: hit.lat, lng: hit.lng, matchedTitle: hit.title, source: hit.source } : null,
    distKm,
    flagged: distKm != null && distKm > 0.3, // oltre 300m di scostamento: da rivedere
  });

  console.error(
    `[${i + 1}/${MOCK_SPACES.length}] ${s.name}: ${
      hit ? `${hit.lat}, ${hit.lng} (Δ${distKm?.toFixed(2)}km) — "${hit.title}"` : "NOT FOUND"
    }`
  );

  await sleep(300);
}

const outPath =
  "/private/tmp/claude-501/-Users-svevamorini-Library-Mobile-Documents-com-apple-CloudDocs-BEMACS-3RD-YEAR---2ND-SEMESTER--YONSEI--DATA-VISUALIZATION-GROUP-PROJECT-COLLEGE-ROI-collegeroi/6384d364-ef9c-4dfb-9465-4c7f2e3dff9f/scratchpad/serpapi-results.json";
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

const flagged = results.filter((r) => r.flagged);
const notFound = results.filter((r) => !r.new);
console.error(`\nDone. ${flagged.length} scostamenti >300m da rivedere. ${notFound.length} non trovati.`);
console.error(`Risultati completi in: ${outPath}`);
