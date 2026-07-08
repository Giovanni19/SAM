"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  typeMeta, getAmenities, distanceKm, formatDistance,
  getZones, getTypes, AMENITY_FILTERS, fuzzyFilter, isOpenNow,
} from "@/lib/utils";
import SearchBar from "@/components/SearchBar";
import OpenNowBadge from "@/components/OpenNowBadge";

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

  const [query, setQuery] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [pendingZone, setPendingZone] = useState("");
  const [pendingType, setPendingType] = useState("");
  const [pendingFilters, setPendingFilters] = useState(EMPTY_AMENITY_FILTERS);
  const [applied, setApplied] = useState({ zone: "", type: "", ...EMPTY_AMENITY_FILTERS });

  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    let out = spaces.filter((s) => {
      if (applied.zone && s.zone !== applied.zone) return false;
      if (applied.type && s.type !== applied.type) return false;
      return AMENITY_FILTERS.every(({ key }) => !applied[key] || s[key] === applied[key]);
    });
    if (openNow) out = out.filter((s) => isOpenNow(s.hours, now || new Date()) === true);
    out = fuzzyFilter(out, query);
    return out;
  }, [spaces, applied, openNow, query, now]);

  // Posto selezionato sulla mappa (per anteprima + evidenziazione).
  const [selectedId, setSelectedId] = useState(null);
  const selected = useMemo(
    () => filtered.find((s) => s.id === selectedId) || null,
    [filtered, selectedId]
  );

  const [userPos, setUserPos] = useState(null);
  const [status, setStatus] = useState("idle");

  function locate() {
    if (!("geolocation" in navigator)) return setStatus("error");
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

  const canReset =
    applied.zone || applied.type || AMENITY_FILTERS.some(({ key }) => applied[key]) || query || openNow;

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
        query={query}
        onQueryChange={setQuery}
        openNow={openNow}
        onOpenNowChange={setOpenNow}
        onSearch={() => setApplied({ zone: pendingZone, type: pendingType, ...pendingFilters })}
        onReset={() => {
          setPendingZone("");
          setPendingType("");
          setPendingFilters(EMPTY_AMENITY_FILTERS);
          setApplied({ zone: "", type: "", ...EMPTY_AMENITY_FILTERS });
          setQuery("");
          setOpenNow(false);
        }}
        canReset={Boolean(canReset)}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Mappa */}
        <div className="relative h-[70vh] overflow-hidden rounded-2xl border border-sam-cream shadow-card">
          <LeafletMap
            spaces={filtered}
            userPos={userPos}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <button
            onClick={locate}
            className="btn-primary absolute right-3 top-3 z-[1000] shadow-card"
          >
            {status === "loading" ? "Individuo…" : "📍 La mia posizione"}
          </button>
        </div>

        {/* Pannello laterale */}
        <aside className="rounded-2xl border border-sam-cream bg-white p-4 shadow-card">
          {selected ? (
            <SpacePreview space={selected} onClose={() => setSelectedId(null)} />
          ) : !userPos ? (
            <div>
              <h2 className="font-display font-bold text-sam-green">Trova i posti vicini</h2>
              <p className="mt-2 text-sm text-sam-muted">
                Tocca un pin per l'anteprima, oppure attiva la posizione per vedere
                i posti più vicini ordinati per distanza.
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
                      <button
                        onClick={() => setSelectedId(s.id)}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-sam-cream"
                      >
                        <span className="text-lg">{meta.emoji}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-sam-green">{s.name}</span>
                          <span className="block text-xs text-sam-muted">{s.zone}</span>
                        </span>
                        <span className="shrink-0 text-xs font-bold text-sam-brown">
                          {formatDistance(s.dist)}
                        </span>
                      </button>
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

/** Anteprima del posto selezionato sulla mappa. */
function SpacePreview({ space, onClose }) {
  const meta = typeMeta(space.type);
  const amenities = getAmenities(space).slice(0, 4);

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-display font-bold leading-tight text-sam-green">{space.name}</h2>
        <button
          onClick={onClose}
          aria-label="Chiudi anteprima"
          className="shrink-0 rounded-full px-2 text-sam-muted hover:bg-sam-cream"
        >
          ✕
        </button>
      </div>

      {space.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={space.image} alt={space.name} className="mt-2 h-32 w-full rounded-xl object-cover" />
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold text-white ${meta.color}`}>
          {meta.emoji} {meta.label}
        </span>
        {space.rating != null && (
          <span className="text-sam-brown" title="Valutazione Google Maps">
            ★ {space.rating}
            {space.reviewsCount != null && <span className="text-sam-muted"> ({space.reviewsCount})</span>}
            <span className="text-sam-muted"> · Google</span>
          </span>
        )}
      </div>

      <p className="mt-1 text-xs text-sam-muted">
        {space.zone}{space.zone && space.address ? " · " : ""}{space.address}
      </p>

      {space.hours && (
        <div className="mt-2">
          <OpenNowBadge hours={space.hours} size="sm" showUnknown />
        </div>
      )}

      {amenities.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-sam-brown/80">
          {amenities.map((a) => (
            <li key={a.key}>{a.icon} {a.label}</li>
          ))}
        </ul>
      )}

      <Link href={`/spaces/${space.id}`} className="btn-primary mt-4 w-full">
        Vedi dettagli
      </Link>
    </div>
  );
}
