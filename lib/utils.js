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

// Le chiavi sono i valori canonici (in italiano) usati anche nei filtri e in
// ?type=: NON vanno tradotte. L'etichetta mostrata arriva dal dizionario
// (t.types), vedi typeMeta().
export const TYPE_META = {
  Caffetteria: { emoji: "☕", color: "bg-sam-brown", hex: "#5A2A20" },
  Biblioteca: { emoji: "📚", color: "bg-sam-green", hex: "#1F4D3D" },
  Coworking: { emoji: "💻", color: "bg-sam-work", hex: "#7A2E3A" },
  Libreria: { emoji: "📖", color: "bg-sam-orange", hex: "#E0734F" },
  Altro: { emoji: "📍", color: "bg-sam-muted", hex: "#9aa39d" },
};

/** Icona/colore del tipo + etichetta tradotta (t = dizionario i18n). */
export function typeMeta(type, t) {
  const key = TYPE_META[type] ? type : "Altro";
  return { ...TYPE_META[key], label: t?.types?.[key] ?? key };
}

// Tipo Schema.org (JSON-LD) più vicino a ciascun tipo di spazio, per i dati
// strutturati nella pagina di dettaglio (vedi SpaceDetail.jsx).
export const SCHEMA_TYPE = {
  Caffetteria: "CafeOrCoffeeShop",
  Biblioteca: "Library",
  Libreria: "BookStore",
  Coworking: "LocalBusiness",
  Altro: "LocalBusiness",
};

// Uno spazio può avere più categorie (es. Coworking + Caffetteria): appare in
// SAM for Work se una di queste è Coworking, e in SAM se ne ha almeno un'altra.
export function isCoworking(space) {
  return (space.types || []).includes("Coworking");
}

export function isStudySpace(space) {
  return (space.types || []).some((t) => t !== "Coworking");
}

// Tipo singolo da mostrare come badge/icona, in base alla sezione del sito:
// in SAM for Work è sempre "Coworking"; in SAM è la prima categoria non-Coworking.
export function displayType(space, section) {
  if (section === "work") return "Coworking";
  return (space.types || []).find((t) => t !== "Coworking") || space.types?.[0] || "Altro";
}

/* ------------------------- Amenità (WiFi, prese...) ------------------------ */
// tone: "good" | "mid" | "bad" — usato per colorare il pallino/badge.

// Chiavi = valori canonici salvati su Notion (mai tradotti); il valore è solo
// il "tono" per colorare il pallino. Le etichette stanno in t.amenities.
const TONES = {
  wifi: { confermato: "good", probabile: "mid", "non verificato": "mid", assente: "bad" },
  prese: { abbondanti: "good", alcune: "mid", assenti: "bad", "non verificato": "mid" },
  sedute: { "tavoli grandi": "good", ok: "mid", sgabelli: "bad" },
  rumore: { quiet: "good", moderate: "mid", lively: "bad" },
  stay: { free: "good", min_order: "mid", paid_pass: "bad" },
  ac: { presente: "good", "non verificato": "mid", assente: "bad" },
};

// key = campo dello spazio; dict = namespace in t.amenities (differiscono solo
// per "stayPolicy"/"stay", che nel dizionario è più corto).
const AMENITY_DEFS = [
  { key: "wifi", dict: "wifi", icon: "📶" },
  { key: "prese", dict: "prese", icon: "🔌" },
  { key: "sedute", dict: "sedute", icon: "🪑" },
  { key: "rumore", dict: "rumore", icon: "🔊" },
  { key: "stayPolicy", dict: "stay", icon: "⏱️" },
  { key: "ac", dict: "ac", icon: "❄️" },
];

/** Filtri per amenità della barra di ricerca, con etichette tradotte. */
export function amenityFilters(t) {
  return AMENITY_DEFS.map(({ key, dict }) => ({
    key,
    label: t?.amenities?.groups?.[dict] ?? dict,
    // [valore canonico, etichetta tradotta] — il valore finisce nel filtro.
    options: Object.keys(TONES[dict]).map((value) => [value, t?.amenities?.[dict]?.[value] ?? value]),
  }));
}

/** Chiavi dei filtri per amenità (senza etichette): utile per lo stato dei form. */
export const AMENITY_KEYS = AMENITY_DEFS.map((a) => a.key);

/**
 * Amenità di uno spazio pronte da renderizzare, con etichette tradotte.
 * @returns {{key:string, icon:string, group:string, label:string, tone:string}[]}
 */
export function getAmenities(space, t) {
  return AMENITY_DEFS.filter(({ key }) => space[key]).map(({ key, dict, icon }) => {
    const value = space[key];
    return {
      key: dict,
      icon,
      group: t?.amenities?.groups?.[dict] ?? dict,
      // Se un valore non è mappato (dato nuovo su Notion) mostriamo il valore grezzo.
      label: t?.amenities?.[dict]?.[value] ?? value,
      tone: TONES[dict][value] ?? "mid",
    };
  });
}

/* --------------------- Feedback rapido nei commenti ----------------------- */
// I valori sono canonici e finiscono in comments.tags su Supabase: NON vanno
// tradotti, altrimenti i commenti già salvati non corrisponderebbero più.
// Le etichette mostrate arrivano da t.comments.options.
export const COMMENT_FEEDBACK = [
  { key: "pulizia", options: ["🧼 Ambiente pulito", "😐 Ambiente nella media", "🧹 Poco pulito"] },
  { key: "bagno", options: ["🚻 Bagno pulito", "😐 Bagno nella media", "🚽 Bagno sporco"] },
  { key: "wifi", options: ["📶 WiFi veloce", "😐 WiFi nella media", "📵 WiFi lento o assente"] },
  { key: "prese", options: ["🔌 Tante prese", "😐 Prese sufficienti", "🪫 Poche prese"] },
  { key: "rumore", options: ["🤫 Tranquillo per concentrarsi", "😐 Rumore nella media", "🔊 Troppo rumoroso"] },
  { key: "posti", options: ["🪑 Posti comodi", "😐 Posti nella media", "🥴 Posti scomodi"] },
  { key: "personale", options: ["😊 Personale gentile", "😐 Personale nella media", "😒 Personale scortese"] },
  { key: "prezzi", options: ["💰 Prezzi onesti", "😐 Prezzi nella media", "💸 Prezzi alti"] },
  { key: "accessibilita", options: ["♿ Accessibile in carrozzina", "😐 Accessibilità nella media", "🚫 Non accessibile"] },
];

/** Etichetta tradotta di un tag di commento (fallback: il valore salvato). */
export function commentTagLabel(value, t) {
  return t?.comments?.options?.[value] ?? value;
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

const SCHEMA_DAY = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
  fri: "Friday", sat: "Saturday", sun: "Sunday",
};

// Converte l'oggetto orari nel formato OpeningHoursSpecification di Schema.org.
// Gli orari a cavallo di mezzanotte vengono troncati alle 23:59 di quel giorno
// (approssimazione: Schema.org non rappresenta bene un giorno che sconfina nel
// successivo in una singola voce).
function hoursToSchema(hours) {
  if (!hours || typeof hours !== "object") return undefined;
  const specs = [];
  for (const [key, label] of Object.entries(SCHEMA_DAY)) {
    const r = parseRange(hours[key]);
    if (!r || r.closed) continue;
    specs.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${label}`,
      opens: fmtMin(r.start),
      closes: r.end >= 1440 ? "23:59" : fmtMin(r.end),
    });
  }
  return specs.length ? specs : undefined;
}

/** Meta description per la pagina di uno spazio: usa la descrizione vera se
 * c'è (troncata alla lunghezza consigliata per Google), altrimenti una frase
 * di fallback da zona/tipo/indirizzo. */
export function spaceMetaDescription(space, t) {
  const label = typeMeta(space.type, t).label;
  const fallback =
    t?.locale === "en"
      ? `${label} in Milan${space.zone ? `, ${space.zone} area` : ""}${
          space.address ? ` — ${space.address}` : ""
        }.`
      : `${label} a Milano${space.zone ? ` in zona ${space.zone}` : ""}${
          space.address ? ` — ${space.address}` : ""
        }.`;
  const base = spaceDescription(space, t?.locale) || fallback;
  return base.length > 160 ? `${base.slice(0, 157).trimEnd()}...` : base;
}

/**
 * Descrizione dello spazio nella lingua richiesta. Solo una parte dei posti ha
 * la descrizione inglese su Notion: in sua assenza ripieghiamo su quella
 * italiana, così le schede in inglese non restano vuote.
 */
export function spaceDescription(space, lang) {
  if (lang === "en") return space.descriptionEn || space.description || "";
  return space.description || "";
}

/**
 * Nota dello spazio (accesso / prenotazione) nella lingua richiesta.
 * Stessa regola della descrizione: la traduzione inglese esiste solo dove è
 * stata scritta su Notion, altrimenti si ripiega sull'italiano — meglio una
 * nota in italiano che nessun avviso su un vincolo d'accesso.
 * @param {"accessNote"|"bookingNote"} field
 */
export function spaceNote(space, field, lang) {
  if (lang === "en") return space[`${field}En`] || space[field] || "";
  return space[field] || "";
}

/**
 * Dati strutturati Schema.org (JSON-LD) per la pagina di dettaglio di uno spazio.
 * @param {object} space
 * @param {string} url - URL assoluto della pagina (canonical).
 */
export function spaceJsonLd(space, url, lang) {
  const description = spaceDescription(space, lang);
  return {
    "@context": "https://schema.org",
    "@type": SCHEMA_TYPE[space.type] || "LocalBusiness",
    name: space.name,
    url,
    ...(space.image && { image: space.image }),
    ...(description && { description }),
    ...(space.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: space.address,
        addressLocality: "Milano",
        addressCountry: "IT",
      },
    }),
    ...(space.lat != null && space.lng != null && {
      geo: { "@type": "GeoCoordinates", latitude: space.lat, longitude: space.lng },
    }),
    ...(space.phone && { telephone: space.phone }),
    ...(space.rating != null && space.reviewsCount != null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: space.rating,
        reviewCount: space.reviewsCount,
      },
    }),
    ...(hoursToSchema(space.hours) && { openingHoursSpecification: hoursToSchema(space.hours) }),
  };
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
