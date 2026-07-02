"use client";

import { useMemo, useState } from "react";
import SearchBar from "./SearchBar";
import SpaceList from "./SpaceList";
import { getZones, getTypes, AMENITY_FILTERS } from "@/lib/utils";

const EMPTY_AMENITY_FILTERS = Object.fromEntries(AMENITY_FILTERS.map((f) => [f.key, ""]));

/**
 * Ricerca + lista con filtri Zona/Tipo + amenità (WiFi, Prese, Sedute,
 * Rumore, Permanenza), per personalizzare la ricerca in base alle proprie
 * esigenze. I menu aggiornano una selezione "in sospeso"; il filtro viene
 * applicato solo al click su "Cerca" (o al Reset).
 */
export default function SpacesExplorer({ spaces = [], initialType = "" }) {
  const zones = useMemo(() => getZones(spaces), [spaces]);
  const types = useMemo(() => getTypes(spaces), [spaces]);

  // Selezione in sospeso (nei menu)
  const [pendingZone, setPendingZone] = useState("");
  const [pendingType, setPendingType] = useState(initialType);
  const [pendingFilters, setPendingFilters] = useState(EMPTY_AMENITY_FILTERS);

  // Filtro applicato (dopo "Cerca")
  const [applied, setApplied] = useState({
    zone: "",
    type: initialType,
    ...EMPTY_AMENITY_FILTERS,
  });

  const results = useMemo(() => {
    return spaces.filter((s) => {
      if (applied.zone && s.zone !== applied.zone) return false;
      if (applied.type && s.type !== applied.type) return false;
      return AMENITY_FILTERS.every(({ key }) => !applied[key] || s[key] === applied[key]);
    });
  }, [spaces, applied]);

  const hasFilter =
    applied.zone || applied.type || AMENITY_FILTERS.some(({ key }) => applied[key]);

  return (
    <div>
      <SearchBar
        zones={zones}
        types={types}
        zone={pendingZone}
        type={pendingType}
        onZoneChange={setPendingZone}
        onTypeChange={setPendingType}
        filters={pendingFilters}
        onFilterChange={(key, value) => setPendingFilters((f) => ({ ...f, [key]: value }))}
        onSearch={() => setApplied({ zone: pendingZone, type: pendingType, ...pendingFilters })}
        onReset={() => {
          setPendingZone("");
          setPendingType("");
          setPendingFilters(EMPTY_AMENITY_FILTERS);
          setApplied({ zone: "", type: "", ...EMPTY_AMENITY_FILTERS });
        }}
        canReset={Boolean(hasFilter)}
      />

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-sam-muted">
          {results.length} {results.length === 1 ? "spazio" : "spazi"}
          {applied.zone && <> · <span className="font-semibold text-sam-brown">{applied.zone}</span></>}
          {applied.type && <> · <span className="font-semibold text-sam-brown">{applied.type}</span></>}
        </p>
      </div>

      <div className="mt-4">
        <SpaceList spaces={results} />
      </div>
    </div>
  );
}
