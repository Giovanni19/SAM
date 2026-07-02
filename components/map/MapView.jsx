"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { typeMeta, distanceKm, formatDistance, getZones, getTypes, AMENITY_FILTERS } from "@/lib/utils";
import SearchBar from "@/components/SearchBar";

const EMPTY_AMENITY_FILTERS = Object.fromEntries(AMENITY_FILTERS.map((f) => [f.key, ""]));

// Leaflet usa `window`: carichiamo la mappa solo lato client (niente SSR).
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-sam-cream/50 text-sam-muted">
      Caricamento mappa…
    </div>
  ),
});

export default function MapView({ spaces = [] }) {
  const zones = useMemo(() => getZones(spaces), [spaces]);
  const types = useMemo(() => getTypes(spaces), [spaces]);

  const [pendingZone, setPendingZone] = useState("");
  const [pendingType, setPendingType] = useState("");
  const [pendingFilters, setPendingFilters] = useState(EMPTY_AMENITY_FILTERS);
  const [applied, setApplied] = useState({ zone: "", type: "", ...EMPTY_AMENITY_FILTERS });

  const filtered = useMemo(() => {
    return spaces.filter((s) => {
      if (applied.zone && s.zone !== applied.zone) return false;
      if (applied.type && s.type !== applied.type) return false;
      return AMENITY_FILTERS.every(({ key }) => !applied[key] || s[key] === applied[key]);
    });
  }, [spaces, applied]);

  const [userPos, setUserPos] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ok | denied | error

  function locate() {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setStatus("ok");
      },
      (err) => setStatus(err.code === 1 ? "denied" : "error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Posti (filtrati) ordinati per distanza — solo quando ho la posizione.
  const nearest = useMemo(() => {
    if (!userPos) return [];
    return filtered
      .filter((s) => s.lat != null && s.lng != null)
      .map((s) => ({ ...s, dist: distanceKm(userPos, [s.lat, s.lng]) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 8);
  }, [filtered, userPos]);

  const statusMsg = {
    denied: "Permesso negato. Attivalo dalle impostazioni del browser per vedere i posti vicini.",
    error: "Impossibile ottenere la posizione. Riprova.",
  }[status];

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
        canReset={Boolean(
          applied.zone || applied.type || AMENITY_FILTERS.some(({ key }) => applied[key])
        )}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Mappa */}
        <div className="relative h-[70vh] overflow-hidden rounded-2xl border border-sam-cream shadow-card">
          <LeafletMap spaces={filtered} userPos={userPos} />

          {/* Bottone geolocalizzazione */}
          <button
            onClick={locate}
            className="btn-primary absolute right-3 top-3 z-[1000] shadow-card"
          >
            {status === "loading" ? "Individuo…" : "📍 La mia posizione"}
          </button>
        </div>

        {/* Pannello laterale */}
        <aside className="rounded-2xl border border-sam-cream bg-white p-4 shadow-card">
          {!userPos ? (
            <div>
              <h2 className="font-display font-bold text-sam-green">Trova i posti vicini</h2>
              <p className="mt-2 text-sm text-sam-muted">
                Attiva la posizione per vedere dove sei sulla mappa e i posti più vicini,
                ordinati per distanza.
              </p>
              <button onClick={locate} className="btn-primary mt-4 w-full">
                📍 Usa la mia posizione
              </button>
              {statusMsg && <p className="mt-3 text-sm text-sam-coral">{statusMsg}</p>}
            </div>
          ) : (
            <div>
              <h2 className="font-display font-bold text-sam-green">Più vicini a te</h2>
              <ul className="mt-3 space-y-1">
                {nearest.map((s) => {
                  const meta = typeMeta(s.type);
                  return (
                    <li key={s.id}>
                      <Link
                        href={`/spaces/${s.id}`}
                        className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-sam-cream"
                      >
                        <span className="text-lg">{meta.emoji}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-sam-green">
                            {s.name}
                          </span>
                          <span className="block text-xs text-sam-muted">{s.zone}</span>
                        </span>
                        <span className="shrink-0 text-xs font-bold text-sam-brown">
                          {formatDistance(s.dist)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
