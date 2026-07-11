"use client";

import { useEffect, useMemo, useState } from "react";
import SearchBar from "./SearchBar";
import SpaceList from "./SpaceList";
import { useFavorites } from "@/lib/useFavorites";
import { useAuthPrompt } from "@/components/AuthPrompt";
import { getZones, getTypes, AMENITY_FILTERS, fuzzyFilter, isOpenNow } from "@/lib/utils";

const EMPTY_AMENITY_FILTERS = Object.fromEntries(AMENITY_FILTERS.map((f) => [f.key, ""]));

// True se sono stati scelti dei filtri (Zona / Tipo / amenità) da applicare.
function hasChosenFilters(zone, type, filters) {
  return Boolean(zone || type || AMENITY_FILTERS.some(({ key }) => filters[key]));
}

/**
 * Ricerca + lista con:
 *  - ricerca per nome (fuzzy, tollera i refusi) e "Aperti adesso": filtrano dal vivo
 *  - Zona / Tipo / amenità: si applicano al click su "Cerca"
 */
export default function SpacesExplorer({ spaces = [], initialType = "", hideType = false, basePath = "/spaces" }) {
  const { isLoggedIn } = useFavorites();
  const { show } = useAuthPrompt();
  const zones = useMemo(() => getZones(spaces), [spaces]);
  const types = useMemo(() => getTypes(spaces), [spaces]);

  // Filtri "dal vivo"
  const [query, setQuery] = useState("");
  const [openNow, setOpenNow] = useState(false);

  // Selezione in sospeso (nei menu) + filtro applicato (dopo "Cerca")
  const [pendingZone, setPendingZone] = useState("");
  const [pendingType, setPendingType] = useState(initialType);
  const [pendingFilters, setPendingFilters] = useState(EMPTY_AMENITY_FILTERS);
  const [applied, setApplied] = useState({ zone: "", type: initialType, ...EMPTY_AMENITY_FILTERS });

  // Ora corrente (per "aperti adesso"), aggiornata ogni minuto lato client.
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const results = useMemo(() => {
    let out = spaces.filter((s) => {
      if (applied.zone && s.zone !== applied.zone) return false;
      if (applied.type && s.type !== applied.type) return false;
      return AMENITY_FILTERS.every(({ key }) => !applied[key] || s[key] === applied[key]);
    });
    if (openNow) out = out.filter((s) => isOpenNow(s.hours, now || new Date()) === true);
    out = fuzzyFilter(out, query);
    return out;
  }, [spaces, applied, openNow, query, now]);

  const hasFilter =
    applied.zone || applied.type || AMENITY_FILTERS.some(({ key }) => applied[key]) || query || openNow;

  return (
    <div>
      <SearchBar
        zones={zones}
        types={types}
        hideType={hideType}
        zone={pendingZone}
        type={pendingType}
        onZoneChange={setPendingZone}
        onTypeChange={setPendingType}
        filters={pendingFilters}
        onFilterChange={(key, value) => setPendingFilters((f) => ({ ...f, [key]: value }))}
        query={query}
        onQueryChange={setQuery}
        openNow={openNow}
        onOpenNowChange={setOpenNow}
        onSearch={() => {
          // I filtri sono riservati agli utenti registrati.
          if (!isLoggedIn && hasChosenFilters(pendingZone, pendingType, pendingFilters)) {
            show("Accedi o registrati per usare i filtri");
            return;
          }
          setApplied({ zone: pendingZone, type: pendingType, ...pendingFilters });
        }}
        onReset={() => {
          setPendingZone("");
          setPendingType("");
          setPendingFilters(EMPTY_AMENITY_FILTERS);
          setApplied({ zone: "", type: "", ...EMPTY_AMENITY_FILTERS });
          setQuery("");
          setOpenNow(false);
        }}
        canReset={Boolean(hasFilter)}
      />

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-sam-muted">
          {results.length} {results.length === 1 ? "spazio" : "spazi"}
          {applied.zone && <> · <span className="font-semibold text-sam-brown">{applied.zone}</span></>}
          {applied.type && <> · <span className="font-semibold text-sam-brown">{applied.type}</span></>}
          {openNow && <> · <span className="font-semibold text-sam-green">aperti adesso</span></>}
        </p>
      </div>

      <div className="mt-4">
        <SpaceList spaces={results} basePath={basePath} />
      </div>
    </div>
  );
}
