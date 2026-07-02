"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import { TYPE_META, getAmenities } from "@/lib/utils";

const MILANO_CENTER = [45.4642, 9.19];

const TONE_DOT = {
  good: "text-sam-green",
  mid: "text-sam-yellow",
  bad: "text-sam-coral",
};

/**
 * Mappa Leaflet degli spazi. Ogni spazio è un cerchio di dimensione fissa
 * (nessuna magnitudine da codificare) colorato per Categoria — l'unica
 * dimensione nominale che ha senso distinguere a colpo d'occhio sulla mappa.
 */
export default function MapView({ spaces }) {
  const located = spaces.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sam-cream shadow-card">
      <MapContainer
        center={MILANO_CENTER}
        zoom={12}
        scrollWheelZoom
        style={{ height: "70vh", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {located.map((space) => {
          const meta = TYPE_META[space.type] || TYPE_META.Altro;
          const amenities = getAmenities(space).slice(0, 4);
          return (
            <CircleMarker
              key={space.id}
              center={[space.lat, space.lng]}
              radius={7}
              pathOptions={{
                color: "#FBF8F2",
                weight: 1.5,
                fillColor: meta.hex,
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                    style={{ backgroundColor: meta.hex }}
                  >
                    {meta.emoji} {meta.label}
                  </span>
                  <p className="mt-1.5 font-display text-sm font-bold text-sam-green">
                    {space.name}
                  </p>
                  {space.zone && <p className="text-xs text-sam-muted">{space.zone}</p>}
                  {amenities.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5 text-xs text-sam-brown/80">
                      {amenities.map((a) => (
                        <li key={a.key} className="flex items-center gap-1">
                          <span className={TONE_DOT[a.tone]}>●</span>
                          {a.icon} {a.label}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href={`/spaces/${space.id}`}
                    className="mt-2 inline-block text-xs font-semibold text-sam-green hover:underline"
                  >
                    Vedi dettagli →
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legenda: colore = categoria dello spazio */}
      <div className="absolute bottom-3 right-3 z-[1000] rounded-xl bg-white/95 p-3 text-xs shadow-card">
        <p className="mb-1.5 font-display font-semibold text-sam-green">Categoria</p>
        <ul className="space-y-1">
          {Object.values(TYPE_META)
            .filter((m) => m.label !== "Altro")
            .map((m) => (
              <li key={m.label} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: m.hex }}
                />
                {m.emoji} {m.label}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
