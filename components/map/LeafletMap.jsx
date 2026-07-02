"use client";

import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { typeMeta, distanceKm, formatDistance, MILAN_CENTER } from "@/lib/utils";

// Pallino bianco con bordo verde brand e l'emoji del tipo al centro.
// Niente colore per categoria: l'emoji basta a distinguere il tipo,
// il verde è lo stesso ovunque nell'app (nessuna scala da decifrare).
function placeIcon(type) {
  const meta = typeMeta(type);
  return L.divIcon({
    className: "sam-dot",
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:28px;height:28px;border-radius:50%;
      background:#FBF8F2;border:2.5px solid #1F4D3D;
      box-shadow:0 1px 4px rgba(0,0,0,.25);font-size:14px;line-height:1;">
      ${meta.emoji}
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

// Ricentra la mappa quando cambia la posizione dell'utente.
function Recenter({ pos }) {
  const map = useMap();
  if (pos) map.flyTo(pos, 14, { duration: 0.8 });
  return null;
}

export default function LeafletMap({ spaces = [], userPos = null }) {
  return (
    <MapContainer
      center={userPos || MILAN_CENTER}
      zoom={userPos ? 14 : 12}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      {/* Basemap leggero (CartoDB Positron): pochi dettagli, non compete
          visivamente con i marker degli spazi. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {userPos && <Recenter pos={userPos} />}

      {/* Marker posizione utente — unico elemento colorato, per distinguerlo dagli spazi */}
      {userPos && (
        <CircleMarker
          center={userPos}
          radius={9}
          pathOptions={{ color: "#fff", weight: 3, fillColor: "#2b6cff", fillOpacity: 1 }}
        >
          <Popup>La tua posizione</Popup>
        </CircleMarker>
      )}

      {/* Marker dei posti */}
      {spaces
        .filter((s) => s.lat != null && s.lng != null)
        .map((s) => {
          const meta = typeMeta(s.type);
          const dist = userPos ? distanceKm(userPos, [s.lat, s.lng]) : null;
          return (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={placeIcon(s.type)}>
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontWeight: 700, color: "#1F4D3D" }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "#6b746e", margin: "2px 0 6px" }}>
                    {meta.emoji} {meta.label}
                    {s.zone ? ` · ${s.zone}` : ""}
                    {dist != null ? ` · ${formatDistance(dist)} da te` : ""}
                  </div>
                  <Link href={`/spaces/${s.id}`} style={{ color: "#1F4D3D", fontWeight: 600, fontSize: 13 }}>
                    Vedi dettagli →
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}
