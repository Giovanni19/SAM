"use client";

import { AMENITY_FILTERS } from "@/lib/utils";

// Controllo di ricerca: Zona + Tipo, più i filtri per amenità (WiFi, Prese,
// Sedute, Rumore, Permanenza) così l'utente può restringere la ricerca a
// quello che gli serve davvero. Componente controllato: lo stato vive nel
// genitore (SpacesExplorer / MapView).

const selectClass =
  "w-full rounded-full border border-sam-cream bg-sam-paper px-4 py-2.5 text-sm outline-none focus:border-sam-green";

export default function SearchBar({
  zones = [],
  types = [],
  zone,
  type,
  onZoneChange,
  onTypeChange,
  filters = {},
  onFilterChange,
  onSearch,
  onReset,
  canReset = false,
  query = "",
  onQueryChange,
  openNow = false,
  onOpenNowChange,
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch?.();
      }}
      className="rounded-2xl bg-white p-4 shadow-card"
    >
      {/* Ricerca per nome (fuzzy, tollera i refusi) — filtra mentre scrivi */}
      <label className="mb-3 block">
        <span className="mb-1 block text-xs font-semibold text-sam-green">Cerca un posto</span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange?.(e.target.value)}
          placeholder="Nome del posto (es. Biblioteca Sormani)…"
          className={selectClass}
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span className="mb-1 block text-xs font-semibold text-sam-green">Zona</span>
          <select value={zone} onChange={(e) => onZoneChange?.(e.target.value)} className={selectClass}>
            <option value="">Tutte le zone</option>
            {zones.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </label>

        <label className="flex-1">
          <span className="mb-1 block text-xs font-semibold text-sam-green">Tipo di spazio</span>
          <select value={type} onChange={(e) => onTypeChange?.(e.target.value)} className={selectClass}>
            <option value="">Tutti i tipi</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Filtri per amenità: personalizza in base a cosa ti serve davvero */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {AMENITY_FILTERS.map(({ key, label, map }) => (
          <label key={key}>
            <span className="mb-1 block text-xs font-semibold text-sam-green">{label}</span>
            <select
              value={filters[key] || ""}
              onChange={(e) => onFilterChange?.(key, e.target.value)}
              className={selectClass}
            >
              <option value="">Indifferente</option>
              {Object.entries(map).map(([value, meta]) => (
                <option key={value} value={value}>{meta.label}</option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="submit" className="btn-primary">
          🔍 Cerca
        </button>
        {canReset && (
          <button type="button" onClick={onReset} className="btn-outline">
            Reset
          </button>
        )}
        <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-sam-brown">
          <input
            type="checkbox"
            checked={openNow}
            onChange={(e) => onOpenNowChange?.(e.target.checked)}
            className="h-4 w-4 accent-sam-green"
          />
          Aperti adesso
        </label>
      </div>
    </form>
  );
}
