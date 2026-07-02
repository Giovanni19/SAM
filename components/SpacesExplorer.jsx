"use client";

import { useMemo, useState } from "react";
import SearchBar from "./SearchBar";
import SpaceList from "./SpaceList";
import { getZones, getTypes } from "@/lib/utils";

/**
 * Ricerca + lista con filtri Zona/Tipo.
 * I menu aggiornano una selezione "in sospeso"; il filtro viene applicato
 * solo al click su "Cerca" (o al Reset).
 */
export default function SpacesExplorer({ spaces = [], initialType = "" }) {
  const zones = useMemo(() => getZones(spaces), [spaces]);
  const types = useMemo(() => getTypes(spaces), [spaces]);

  // Selezione in sospeso (nei menu)
  const [pendingZone, setPendingZone] = useState("");
  const [pendingType, setPendingType] = useState(initialType);

  // Filtro applicato (dopo "Cerca")
  const [applied, setApplied] = useState({ zone: "", type: initialType });

  const results = useMemo(() => {
    return spaces.filter((s) => {
      if (applied.zone && s.zone !== applied.zone) return false;
      if (applied.type && s.type !== applied.type) return false;
      return true;
    });
  }, [spaces, applied]);

  const hasFilter = applied.zone || applied.type;

  return (
    <div>
      <SearchBar
        zones={zones}
        types={types}
        zone={pendingZone}
        type={pendingType}
        onZoneChange={setPendingZone}
        onTypeChange={setPendingType}
        onSearch={() => setApplied({ zone: pendingZone, type: pendingType })}
        onReset={() => {
          setPendingZone("");
          setPendingType("");
          setApplied({ zone: "", type: "" });
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
