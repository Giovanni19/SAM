"use client";

import { amenityFilters } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";

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
  hideType = false,
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
  const { t } = useI18n();

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
        <span className="mb-1 block text-xs font-semibold text-sam-green">{t.search.queryLabel}</span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange?.(e.target.value)}
          placeholder={t.search.queryPlaceholder}
          className={selectClass}
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span className="mb-1 block text-xs font-semibold text-sam-green">{t.search.zone}</span>
          <select value={zone} onChange={(e) => onZoneChange?.(e.target.value)} className={selectClass}>
            <option value="">{t.search.allZones}</option>
            {zones.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </label>

        {!hideType && (
          <label className="flex-1">
            <span className="mb-1 block text-xs font-semibold text-sam-green">{t.search.type}</span>
            <select value={type} onChange={(e) => onTypeChange?.(e.target.value)} className={selectClass}>
              <option value="">{t.search.allTypes}</option>
              {/* value = tipo canonico (italiano), etichetta tradotta */}
              {types.map((type) => (
                <option key={type} value={type}>{t.types[type] ?? type}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Filtri per amenità: personalizza in base a cosa ti serve davvero */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {amenityFilters(t).map(({ key, label, options }) => (
          <label key={key}>
            <span className="mb-1 block text-xs font-semibold text-sam-green">{label}</span>
            <select
              value={filters[key] || ""}
              onChange={(e) => onFilterChange?.(key, e.target.value)}
              className={selectClass}
            >
              <option value="">{t.search.any}</option>
              {options.map(([value, optionLabel]) => (
                <option key={value} value={value}>{optionLabel}</option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="submit" className="btn-primary">
          {t.search.submit}
        </button>
        {canReset && (
          <button type="button" onClick={onReset} className="btn-outline">
            {t.search.reset}
          </button>
        )}
        <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-sam-brown">
          <input
            type="checkbox"
            checked={openNow}
            onChange={(e) => onOpenNowChange?.(e.target.checked)}
            className="h-4 w-4 accent-sam-green"
          />
          {t.search.openNow}
        </label>
      </div>
    </form>
  );
}
