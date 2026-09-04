import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { MOCK_SPACES } from "./mockData";
import { isCoworking, isStudySpace, displayType } from "./utils";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === "true";

// Usa lo snapshot locale se richiesto esplicitamente o se manca la config Supabase.
const shouldUseMock = USE_MOCK_DATA || !SUPABASE_URL || !SUPABASE_ANON_KEY;

// Client dedicato di sola lettura: niente cookie/sessione, perché getSpaces()
// viene chiamata anche da contesti non request-scoped (es. app/sitemap.js).
// La tabella `places` ha RLS con select pubblica, quindi l'anon key basta.
const supabase = shouldUseMock ? null : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** Converte una riga snake_case della tabella `places` nello shape usato dall'app. */
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

const byName = (a, b) => a.name.localeCompare(b.name, "it");

async function fetchSpacesFromSupabase() {
  const { data, error } = await supabase.from("places").select("*");
  if (error) throw new Error(error.message);
  return data.map(normalizeRow).sort(byName);
}

// Cache di 24 ore, stesso TTL usato in precedenza per Notion: il sito non
// interroga Supabase a ogni visita, Next.js rigenera in background.
const getCachedSpaces = shouldUseMock
  ? null
  : unstable_cache(fetchSpacesFromSupabase, ["places"], { revalidate: 86400 });

/** Restituisce tutti gli spazi studio (ordinati per nome). */
export async function getSpaces() {
  if (shouldUseMock) {
    return [...MOCK_SPACES].sort(byName);
  }

  try {
    return await getCachedSpaces();
  } catch (err) {
    console.error("[places] getSpaces fallita, uso lo snapshot locale:", err.message);
    return [...MOCK_SPACES].sort(byName);
  }
}

/** Restituisce un singolo spazio per id (query diretta, non passa dalla cache). */
export async function getSpaceById(id) {
  if (shouldUseMock) {
    return MOCK_SPACES.find((s) => s.id === id) || null;
  }

  try {
    const { data, error } = await supabase.from("places").select("*").eq("id", id).single();
    if (error || !data) return null;
    return normalizeRow(data);
  } catch (err) {
    console.error("[places] getSpaceById fallita, uso lo snapshot locale:", err.message);
    return MOCK_SPACES.find((s) => s.id === id) || null;
  }
}

// Spazi da studio (SAM): tutto ciò che ha almeno una categoria diversa da
// Coworking. Un posto Coworking+Caffetteria compare anche qui.
export async function getStudySpaces() {
  const spaces = await getSpaces();
  return spaces.filter(isStudySpace).map((s) => ({ ...s, type: displayType(s, "study") }));
}

// Coworking (SAM for Work): tutto ciò che ha la categoria Coworking, anche se
// ha anche altre categorie.
export async function getWorkSpaces() {
  const spaces = await getSpaces();
  return spaces.filter(isCoworking).map((s) => ({ ...s, type: displayType(s, "work") }));
}
