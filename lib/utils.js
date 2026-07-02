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
  Coworking: { label: "Coworking", emoji: "💻", color: "bg-sam-terracotta", hex: "#B14B36" },
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
