"use client";

// Controllo di ricerca: menu a tendina Zona + Tipo e pulsante "Cerca".
// La barra di testo libera è stata rimossa (verrà eventualmente aggiunta più avanti).
// È un componente controllato: lo stato vive in SpacesExplorer.

export default function SearchBar({
  zones = [],
  types = [],
  zone,
  type,
  onZoneChange,
  onTypeChange,
  onSearch,
  onReset,
  canReset = false,
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch?.();
      }}
      className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card sm:flex-row sm:items-end"
    >
      <label className="flex-1">
        <span className="mb-1 block text-xs font-semibold text-sam-green">Zona</span>
        <select
          value={zone}
          onChange={(e) => onZoneChange?.(e.target.value)}
          className="w-full rounded-full border border-sam-cream bg-sam-paper px-4 py-2.5 text-sm outline-none focus:border-sam-green"
        >
          <option value="">Tutte le zone</option>
          {zones.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
      </label>

      <label className="flex-1">
        <span className="mb-1 block text-xs font-semibold text-sam-green">Tipo di spazio</span>
        <select
          value={type}
          onChange={(e) => onTypeChange?.(e.target.value)}
          className="w-full rounded-full border border-sam-cream bg-sam-paper px-4 py-2.5 text-sm outline-none focus:border-sam-green"
        >
          <option value="">Tutti i tipi</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>

      <div className="flex gap-2">
        <button type="submit" className="btn-primary">
          🔍 Cerca
        </button>
        {canReset && (
          <button type="button" onClick={onReset} className="btn-outline">
            Reset
          </button>
        )}
      </div>
    </form>
  );
}
