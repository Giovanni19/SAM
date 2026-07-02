import { Client } from "@notionhq/client";
import { MOCK_SPACES } from "./mockData";
import { CATEGORY_TO_TYPE, deriveZoneFromAddress } from "./utils";

// Database reale "Places" del workspace SAM — Study Café Milano.
const DEFAULT_DATABASE_ID = "9f852898-1de5-4013-b4bd-383f93e160fd";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || DEFAULT_DATABASE_ID;
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === "true";

// Usa lo snapshot locale se richiesto esplicitamente o se manca il token.
const shouldUseMock = USE_MOCK_DATA || !NOTION_TOKEN;

const notion = shouldUseMock ? null : new Client({ auth: NOTION_TOKEN });

/* ---------- Helper per estrarre valori dalle property Notion ---------- */

const getText = (prop) =>
  prop?.title?.[0]?.plain_text || prop?.rich_text?.[0]?.plain_text || "";

const getSelect = (prop) => prop?.select?.name || "";
const getNumber = (prop) => (typeof prop?.number === "number" ? prop.number : null);
const getUrl = (prop) => prop?.url || "";

// La descrizione nel DB è a volte bilingue ("IT / EN"): teniamo la parte italiana.
function italianPart(text) {
  if (!text) return "";
  return text.split(" / ")[0].trim();
}

/** Normalizza una pagina Notion (schema "Places") nello shape usato dall'app. */
function normalizeSpace(page) {
  const p = page.properties || {};
  const address = getText(p["Indirizzo"]);
  const zone = getSelect(p["Zona"]) || deriveZoneFromAddress(address);
  const categoria = getSelect(p["Categoria"]);

  const description =
    getText(p["Descrizione IT"]) || italianPart(getText(p["Descrizione"]));

  return {
    id: page.id.replace(/-/g, ""),
    name: getText(p["Nome"]),
    address,
    zone,
    type: CATEGORY_TO_TYPE[categoria] || "Altro",
    wifi: getSelect(p["WiFi"]) || null,
    prese: getSelect(p["Prese"]) || null,
    sedute: getSelect(p["Sedute"]) || null,
    rumore: getSelect(p["Rumore"]) || null,
    stayPolicy: getSelect(p["Stay Policy"]) || null,
    lat: getNumber(p["Latitude"]),
    lng: getNumber(p["Longitude"]),
    description,
    googleMaps: getUrl(p["Google Maps"]) || null,
    website: getUrl(p["Sito Web"]) || null,
  };
}

/* ------------------------------ API pubblica ------------------------------ */

const byName = (a, b) => a.name.localeCompare(b.name, "it");

/** Restituisce tutti gli spazi studio (ordinati per nome). */
export async function getSpaces() {
  if (shouldUseMock) {
    return [...MOCK_SPACES].sort(byName);
  }

  try {
    const pages = [];
    let cursor;
    do {
      const res = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        start_cursor: cursor,
        page_size: 100,
      });
      pages.push(...res.results);
      cursor = res.has_more ? res.next_cursor : undefined;
    } while (cursor);

    return pages
      .map(normalizeSpace)
      .filter((s) => s.name && !s.name.startsWith("ELIMINARE"))
      .sort(byName);
  } catch (err) {
    console.error("[notion] getSpaces fallita, uso lo snapshot locale:", err.message);
    return [...MOCK_SPACES].sort(byName);
  }
}

/** Restituisce un singolo spazio per id (id senza trattini). */
export async function getSpaceById(id) {
  const spaces = await getSpaces();
  return spaces.find((s) => s.id === id) || null;
}
