// Utility condivise

/** Unisce classi condizionali (mini clsx). */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/* ----------------------------- Tipi di spazio ----------------------------- */

// Mappa la property Notion "Categoria" ai tipi mostrati nell'app.
export const CATEGORY_TO_TYPE = {
  cafe: "Caffetteria",
  library: "Biblioteca",
  coworking: "Coworking",
  bookstore: "Libreria",
};

export const TYPE_META = {
  Caffetteria: { label: "Caffetteria", emoji: "☕", color: "bg-sam-orange", hex: "#E0734F" },
  Biblioteca: { label: "Biblioteca", emoji: "📚", color: "bg-sam-green", hex: "#1F4D3D" },
  Coworking: { label: "Coworking", emoji: "💻", color: "bg-sam-work", hex: "#7A2E3A" },
  Libreria: { label: "Libreria", emoji: "📖", color: "bg-sam-brown", hex: "#5A2A20" },
  Altro: { label: "Altro", emoji: "📍", color: "bg-sam-muted", hex: "#9aa39d" },
};

export function typeMeta(type) {
  return TYPE_META[type] || TYPE_META.Altro;
}

/* ------------------------- Amenità (WiFi, prese...) ------------------------ */
// tone: "good" | "mid" | "bad" — usato per colorare il pallino/badge.

const WIFI = {
  confermato: { tone: "good", label: "WiFi confermato" },
  probabile: { tone: "mid", label: "WiFi probabile" },
  "non verificato": { tone: "mid", label: "WiFi non verificato" },
  assente: { tone: "bad", label: "WiFi assente" },
};
const PRESE = {
  abbondanti: { tone: "good", label: "Prese abbondanti" },
  alcune: { tone: "mid", label: "Alcune prese" },
  assenti: { tone: "bad", label: "Niente prese" },
  "non verificato": { tone: "mid", label: "Prese non verificate" },
};
const SEDUTE = {
  "tavoli grandi": { tone: "good", label: "Tavoli grandi" },
  ok: { tone: "mid", label: "Sedute comode" },
  sgabelli: { tone: "bad", label: "Solo sgabelli" },
};
const RUMORE = {
  quiet: { tone: "good", label: "Silenzioso" },
  moderate: { tone: "mid", label: "Rumore moderato" },
  lively: { tone: "bad", label: "Vivace / rumoroso" },
};
const STAY = {
  free: { tone: "good", label: "Puoi restare liberamente" },
  min_order: { tone: "mid", label: "Serve una consumazione" },
  paid_pass: { tone: "bad", label: "Ingresso a pagamento" },
};

/** Gruppi di filtri per amenità, usati dalla barra di ricerca (Zona/Tipo + questi). */
export const AMENITY_FILTERS = [
  { key: "wifi", label: "WiFi", map: WIFI },
  { key: "prese", label: "Prese", map: PRESE },
  { key: "sedute", label: "Sedute", map: SEDUTE },
  { key: "rumore", label: "Rumore", map: RUMORE },
  { key: "stayPolicy", label: "Permanenza", map: STAY },
];

/**
 * Restituisce la lista di amenità di uno spazio, pronta da renderizzare.
 * @returns {{key:string, icon:string, group:string, label:string, tone:string}[]}
 */
export function getAmenities(space) {
  const rows = [
    { key: "wifi", icon: "📶", group: "WiFi", map: WIFI, value: space.wifi },
    { key: "prese", icon: "🔌", group: "Prese", map: PRESE, value: space.prese },
    { key: "sedute", icon: "🪑", group: "Sedute", map: SEDUTE, value: space.sedute },
    { key: "rumore", icon: "🔊", group: "Rumore", map: RUMORE, value: space.rumore },
    { key: "stay", icon: "⏱️", group: "Permanenza", map: STAY, value: space.stayPolicy },
  ];

  return rows
    .filter((r) => r.value)
    .map((r) => {
      const meta = r.map[r.value] || { tone: "mid", label: r.value };
      return { key: r.key, icon: r.icon, group: r.group, ...meta };
    });
}

/* ---------------------------------- Zone ---------------------------------- */

// Fallback: deriva la zona dal CAP dell'indirizzo se la property Zona è vuota.
const CAP_TO_ZONE = {
  20121: "Brera / Garibaldi",
  20122: "Centro",
  20123: "Centro",
  20124: "Porta Venezia",
  20125: "Bicocca",
  20126: "Bicocca",
  20127: "Loreto / NoLo",
  20129: "Città Studi",
  20131: "Città Studi",
  20133: "Città Studi",
  20135: "Porta Romana",
  20136: "Bocconi",
  20137: "Porta Romana",
  20139: "Corvetto",
  20141: "Vigentino / Chiesa Rossa",
  20142: "Barona",
  20143: "Navigli",
  20144: "Tortona / Porta Genova",
  20146: "Giambellino",
  20151: "Gallaratese",
  20154: "Sempione / Sarpi",
  20158: "Bovisa",
  20159: "Isola",
  // Aggiunti per le biblioteche del Sistema Bibliotecario di Milano (2026-07-11).
  20132: "Crescenzago",
  20147: "Lorenteggio",
  20153: "Baggio",
  20156: "Villapizzone",
  20157: "Quarto Oggiaro",
  20161: "Affori",
  20162: "Niguarda",
};

export function deriveZoneFromAddress(address) {
  if (!address) return "";
  const cap = address.match(/\b(201\d\d)\b/);
  return (cap && CAP_TO_ZONE[cap[1]]) || "";
}

/* ---------------------------------- Mappa --------------------------------- */

// Centro di Milano (Duomo) — usato come vista iniziale della mappa.
export const MILAN_CENTER = [45.4642, 9.19];

/** Distanza in km tra due coordinate (formula dell'emisenoverso / haversine). */
export function distanceKm(a, b) {
  if (!a || !b) return null;
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Formatta una distanza in km in modo leggibile (es. "450 m", "1.2 km"). */
export function formatDistance(km) {
  if (km == null) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/** Ricava la lista unica di zone dagli spazi (ordinata). */
export function getZones(spaces) {
  return [...new Set(spaces.map((s) => s.zone).filter(Boolean))].sort();
}

/** Ricava la lista unica di tipi dagli spazi (ordinata). */
export function getTypes(spaces) {
  return [...new Set(spaces.map((s) => s.type).filter(Boolean))].sort();
}

/* ------------------------ Orari / "aperto adesso" ------------------------- */
// hours = { mon: "9 AM–6 PM", tue: "Closed", ... } (formato Google Maps).
// getDay(): 0 = domenica ... 6 = sabato.
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function parseClock(token, fallbackMeridiem) {
  const m = String(token).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const mer = (m[3] || fallbackMeridiem || "").toLowerCase();
  if (mer === "am" && h === 12) h = 0;
  else if (mer === "pm" && h !== 12) h += 12;
  return h * 60 + min;
}

// Ritorna { closed } | { start, end (minuti, end può superare 1440) } | null.
function parseRange(str) {
  if (!str) return null;
  const s = str.trim();
  if (/chius|closed/i.test(s)) return { closed: true };
  if (/24\s*h|24 hours|24\/7/i.test(s)) return { start: 0, end: 1440 };
  const parts = s.split(/\s*[–—-]\s*/); // en dash, em dash, hyphen
  if (parts.length < 2) return null;
  const endMer = (parts[1].match(/(am|pm)/i) || [])[0];
  const start = parseClock(parts[0], endMer);
  let end = parseClock(parts[1]);
  if (start == null || end == null) return null;
  if (end <= start) end += 1440; // a cavallo di mezzanotte
  return { start, end };
}

function fmtMin(m) {
  const h = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  return `${h}:${String(mm).padStart(2, "0")}`;
}

/**
 * Stato di apertura in tempo reale.
 * @returns {{state:"open"|"closed"|"unknown", closesAt?:string, opensAt?:string}}
 */
export function openStatus(hours, now = new Date()) {
  if (!hours || typeof hours !== "object") return { state: "unknown" };
  const dayIdx = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todayKey = DAY_KEYS[dayIdx];
  const yestKey = DAY_KEYS[(dayIdx + 6) % 7];

  // Controlla la fascia di oggi e quella di ieri (se sconfina oltre mezzanotte).
  const checks = [
    { r: parseRange(hours[todayKey]), t: nowMin },
    { r: parseRange(hours[yestKey]), t: nowMin + 1440 },
  ];
  let known = false;
  for (const { r, t } of checks) {
    if (!r) continue;
    known = true;
    if (r.closed) continue;
    if (t >= r.start && t < r.end) {
      return { state: "open", closesAt: fmtMin(r.end) };
    }
  }
  if (hours[todayKey] !== undefined || known) return { state: "closed" };
  return { state: "unknown" };
}

/** true se aperto adesso, false se chiuso, null se orari sconosciuti. */
export function isOpenNow(hours, now) {
  const st = openStatus(hours, now).state;
  return st === "unknown" ? null : st === "open";
}

/* ----------------------- Ricerca con tolleranza typo ---------------------- */

/** Minuscolo + rimozione accenti, per confronti robusti. */
export function normalizeText(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // rimuove i segni diacritici (accenti)
    .trim();
}

// Distanza di edit (Levenshtein) tra due stringhe.
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diag + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      diag = tmp;
    }
  }
  return prev[n];
}

/** Punteggio di somiglianza 0–1 tra query e testo, tollerante ai typo. */
export function fuzzyScore(query, text) {
  const q = normalizeText(query);
  const t = normalizeText(text);
  if (!q) return 1;
  if (t.includes(q)) return 1;
  const words = t.split(/[^a-z0-9]+/).filter(Boolean);
  let best = 0;
  for (const w of words) {
    if (w.startsWith(q)) return 0.92;
    const d = levenshtein(q, w);
    const sim = 1 - d / Math.max(q.length, w.length);
    if (sim > best) best = sim;
  }
  return best;
}

/** Filtra e ordina gli spazi per somiglianza del nome alla query (fuzzy). */
export function fuzzyFilter(spaces, query, threshold = 0.5) {
  if (!query || !query.trim()) return spaces;
  return spaces
    .map((s) => ({ s, score: fuzzyScore(query, s.name) }))
    .filter((x) => x.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.s);
}
