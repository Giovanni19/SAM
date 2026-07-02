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
  Caffetteria: { label: "Caffetteria", emoji: "☕", color: "bg-sam-orange" },
  Biblioteca: { label: "Biblioteca", emoji: "📚", color: "bg-sam-green" },
  Coworking: { label: "Coworking", emoji: "💻", color: "bg-sam-terracotta" },
  Libreria: { label: "Libreria", emoji: "📖", color: "bg-sam-brown" },
  Altro: { label: "Altro", emoji: "📍", color: "bg-sam-muted" },
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

/* -------------------------------- Study score ------------------------------ */

/** Formatta il punteggio di studiabilità (0–100). Ritorna null se assente/zero. */
export function formatScore(score) {
  if (score == null || score <= 0) return null;
  return Math.round(score);
}

/** Etichetta qualitativa del punteggio. */
export function scoreLabel(score) {
  if (score == null) return "";
  if (score >= 85) return "Top per studiare";
  if (score >= 70) return "Ottimo";
  if (score >= 50) return "Buono";
  return "Così così";
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

/** Ricava la lista unica di zone dagli spazi (ordinata). */
export function getZones(spaces) {
  return [...new Set(spaces.map((s) => s.zone).filter(Boolean))].sort();
}

/** Ricava la lista unica di tipi dagli spazi (ordinata). */
export function getTypes(spaces) {
  return [...new Set(spaces.map((s) => s.type).filter(Boolean))].sort();
}
