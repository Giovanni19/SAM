"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import SearchBar from "./SearchBar";
import { getZones, getTypes } from "@/lib/utils";

// react-leaflet usa `window`: va caricato solo lato client.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] items-center justify-center rounded-2xl border border-sam-cream bg-white text-sm text-sam-muted">
      Caricamento mappa…
    </div>
  ),
});

/** Ricerca + filtri Zona/Tipo applicati direttamente ai marker della mappa. */
export default function SpacesMapExplorer({ spaces = [] }) {
  const zones = useMemo(() => getZones(spaces), [spaces]);
  const types = useMemo(() => getTypes(spaces), [spaces]);

  const [pendingZone, setPendingZone] = useState("");
  const [pendingType, setPendingType] = useState("");
  const [applied, setApplied] = useState({ zone: "", type: "" });

  const results = useMemo(() => {
    return spaces.filter((s) => {
      if (applied.zone && s.zone !== applied.zone) return false;
      if (applied.type && s.type !== applied.type) return false;
      return true;
    });
  }, [spaces, applied]);

  const located = results.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng));
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
          {located.length} {located.length === 1 ? "spazio" : "spazi"} sulla mappa
          {applied.zone && <> · <span className="font-semibold text-sam-brown">{applied.zone}</span></>}
          {applied.type && <> · <span className="font-semibold text-sam-brown">{applied.type}</span></>}
        </p>
      </div>

      <div className="mt-4">
        <MapView spaces={located} />
      </div>
    </div>
  );
}
